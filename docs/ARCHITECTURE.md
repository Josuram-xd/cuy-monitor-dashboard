# Architecture — cuy-monitor-dashboard

> React 19.3 · TypeScript 6.0 (strict) · Vite 8 · Node 24 LTS · React Router 8 · TanStack Query 5 · @stomp/stompjs 7 · Recharts 3 · i18next 26
> Hosting: Docker image (static build served by Caddy) on the EC2, behind the main Caddy · Last reviewed: 2026-10-03

## 1. Context

The dashboard is a static single-page app. It has no server logic of its own: it reads everything from `cuy-monitor-backend` over HTTPS and receives live updates over a STOMP WebSocket. Since ADR-011 it is served **from the same domain** as the API, so there is no CORS and the WebSocket goes to the same origin.

```
Browser (farmer's phone / PC)
   │  https://cuymonitor.duckdns.org
   ▼
Caddy (EC2, public :443)
   ├── /                 ──► dashboard container (static files, SPA fallback to index.html)
   ├── /api/auth/**      ──► backend   (public: register, login, verify code)
   ├── /api/**           ──► backend   (Authorization: Bearer <jwt>)
   └── /ws               ──► backend   (STOMP; JWT in the CONNECT frame)
                                subscribe /topic/cages/{cageId}
```

The dashboard never talks to the database (RDS) or the ai-service directly.

## 2. Folder structure

```
cuy-monitor-dashboard/
├── package.json            "engines": { "node": ">=24" }
├── vite.config.ts          dev proxy: /api and /ws → VITE_DEV_BACKEND (same-origin also in dev)
├── tsconfig.json           "strict": true
├── eslint.config.js        typescript-eslint
├── Dockerfile              node:24 build → caddy:2.11 serving dist/
├── Caddyfile               file_server + try_files {path} /index.html (inside the image, port 80)
├── .dockerignore
├── .env.example            VITE_API_URL, VITE_WS_URL, VITE_CAGE_ID, VITE_USE_MOCKS, VITE_DEV_BACKEND
└── src/
    ├── main.tsx            QueryClientProvider, AuthProvider, RouterProvider, i18n init
    ├── App.tsx             routes (public + RequireAuth)
    ├── i18n/
    │   ├── index.ts        i18next, default and fallback language "es"
    │   └── locales/es.json ALL user-facing text
    ├── types/              GuineaPig.ts, HealthStatus.ts, MarkColor.ts, Alert.ts, CageHealth.ts, WeightReading.ts,
    │                       User.ts, Auth.ts (LoginChallenge, AuthToken)
    ├── auth/
    │   ├── AuthProvider.tsx   session state, login / verify / logout, auto-logout at expiresAt
    │   ├── useAuth.ts
    │   ├── RequireAuth.tsx    redirects to /login?next=<path> when there's no session
    │   └── tokenStorage.ts    sessionStorage + memory (the only place that touches the token)
    ├── api/
    │   ├── client.ts       fetch wrapper: base URL, JSON, Bearer header, 401 → logout, error normalization
    │   ├── auth.ts         register, login, verifyOtp
    │   ├── account.ts      getMe, updateProfile, changePassword, deactivate
    │   ├── cages.ts
    │   ├── guineaPigs.ts
    │   └── alerts.ts
    ├── hooks/              useCageHealth, useGuineaPigs, useGuineaPigHistory, useAlerts, useMe (TanStack Query)
    ├── realtime/
    │   └── useLiveCage.ts  STOMP client (only with a session), token in connectHeaders, updates the query cache
    ├── pages/              Login, Register, VerifyCode, CageOverview, GuineaPigDetail, Alerts,
    │                       RegisterGuineaPig, Weight, Account
    ├── components/         see DESIGN_SYSTEM.md
    ├── mocks/              fake responses used when VITE_USE_MOCKS=true (incl. fake auth, code 123456)
    └── styles/             tokens.css, reset.css, global.css
```

## 3. Authentication

One kind of user, no roles. Contract: `cuy-monitor-backend/docs/contracts/auth-api.md`.

### 3.1 Flows

```
/register  ─POST /api/auth/register─►  201 {challengeId, expiresAt}  ─► /verify (state: challengeId, masked email, "register")
/login     ─POST /api/auth/login────►  200 {challengeId, expiresAt}  ─► /verify (state: challengeId, "login")
/verify    ─POST /api/auth/otp/verify►  200 {accessToken, expiresAt} ─► save session ─► navigate(next ?? "/")
           "Reenviar código" = repeat POST /api/auth/login with the same credentials held in memory
           (for register: login with the username/password just entered; the account stays PENDING until verified)
```

- Credentials typed in `/login` or `/register` are kept **only in memory** (React state passed to `/verify`) so the code can be resent; never stored.
- If `/verify` is opened without a `challengeId` (e.g. page reload), go back to `/login`.

### 3.2 Session

| Item | Rule |
|---|---|
| Storage | `sessionStorage` (`cuy.session` = `{ accessToken, expiresAt }`) + memory. Never `localStorage` or cookies |
| Lifetime | 30 min (backend). No refresh token |
| Auto-logout | `AuthProvider` sets a timer to `expiresAt`; when it fires → logout with reason `expired` |
| 401 on a protected call | `client.ts` calls `logout('expired')` once and redirects to `/login` with the message "Tu sesión terminó, vuelve a entrar" |
| Logout | clear storage, `queryClient.clear()`, disconnect STOMP, `navigate('/login')` |
| Disabled account | backend answers `401`; same handling |

### 3.3 Routes

| Route | Guard |
|---|---|
| `/login`, `/register`, `/verify` | Public. If there is already a session → redirect to `/` |
| `/`, `/guinea-pigs/:id`, `/guinea-pigs/new`, `/alerts`, `/weight`, `/account` | `RequireAuth` |

## 4. Data flow

### 4.1 Server state (REST)

- All REST data goes through **TanStack Query**. Components never call `fetch` directly.
- One hook per resource in `src/hooks/`, one function per endpoint in `src/api/`.
- Query keys: `['me']`, `['cage', cageId, 'health']`, `['cage', cageId, 'guinea-pigs']`, `['guinea-pig', id, 'history', range]`, `['alerts', status]`, `['cage', cageId, 'weight', range]`.
- Mutations: register guinea pig (`POST`), mark alert reviewed (`PATCH`), update profile / change password / deactivate (`PUT`/`DELETE` on `/api/users/me`). On success, invalidate the related keys. Deactivate → logout.
- Queries are only enabled when there is a session (`enabled: isAuthenticated`).

### 4.2 Live updates (WebSocket)

```
backend AlertPublisher ─► WebSocketAlertObserver ─► STOMP /topic/cages/{id}
                                                          │
                                   useLiveCage ◄──────────┘
                                        │
                     ├─ queryClient.setQueryData(...)   update the guinea pig card / cage health
                     ├─ queryClient.invalidateQueries(['alerts'])
                     └─ show AlertToast if level is ALERT or CRITICAL
```

- One STOMP connection for the whole app, opened in a provider **inside** `RequireAuth` (no session → no connection).
- `connectHeaders: { Authorization: 'Bearer <token>' }`. If the server rejects the `CONNECT` (token expired) → logout.
- Automatic reconnect with backoff (1 s → 30 s max), always with the current token. Connection state is exposed for `LiveIndicator`.
- On reconnect, refetch cage health and alerts (messages may have been missed while offline).
- Message shape is defined in `cuy-monitor-backend/docs/contracts/` (proposed: `{ "type": "STATUS_CHANGED" | "ALERT_CREATED", "cageId", "guineaPigId", ... }` — confirm there before coding).

### 4.3 UI state

Local component state only (`useState`). Session state lives in `AuthProvider` (React context). No global store: TanStack Query already holds server state.

## 5. Types and contracts

- `src/types/` mirrors `cuy-monitor-backend/docs/contracts/`. Enums as string-literal unions:

```ts
export type HealthStatus = 'NORMAL' | 'OBSERVED' | 'ALERT' | 'CRITICAL';
export type MarkColor = 'RED' | 'BLUE' | 'GREEN' | 'YELLOW' | 'ORANGE' | 'PURPLE' | 'BLACK' | 'WHITE';
export type AlertStatus = 'OPEN' | 'REVIEWED';
export type UserStatus = 'PENDING_VERIFICATION' | 'ACTIVE' | 'DISABLED';

export interface LoginChallenge { challengeId: string; expiresAt: string }
export interface AuthToken { accessToken: string; tokenType: 'Bearer'; expiresAt: string }
export interface User { id: string; username: string; fullName: string; email: string; status: UserStatus; createdAt: string }
```

- `UNKNOWN` is a UI-only status (`type DisplayStatus = HealthStatus | 'UNKNOWN'`), never sent to the backend.
- Timestamps arrive as ISO-8601 UTC strings and are formatted in the UI with the `es-CO` locale.
- Backend errors arrive as `{ error, message }`; `client.ts` maps `error` codes to `es.json` keys (`auth.error.invalidCredentials`, `auth.error.invalidCode`, `auth.error.userExists`, `auth.error.weakPassword`). The raw `message` is never shown.

## 6. Backend endpoints used

| Screen | Endpoint | Auth |
|---|---|---|
| Register | `POST /api/auth/register` | public |
| Login | `POST /api/auth/login` | public |
| VerifyCode | `POST /api/auth/otp/verify` (and `POST /api/auth/login` to resend) | public |
| Account | `GET/PUT /api/users/me`, `PUT /api/users/me/password`, `DELETE /api/users/me` | JWT |
| CageOverview | `GET /api/cages/{id}/health`, `GET /api/cages/{id}/guinea-pigs`, `GET /api/alerts?status=OPEN` | JWT |
| GuineaPigDetail | `GET /api/guinea-pigs/{id}/history?from=&to=` | JWT |
| Alerts | `GET /api/alerts?status=`, `PATCH /api/alerts/{id}` | JWT |
| RegisterGuineaPig | `POST /api/cages/{id}/guinea-pigs` | JWT |
| Weight | `GET /api/cages/{id}/weight?from=&to=` | JWT |
| All private pages | `WS /ws` → `/topic/cages/{id}` | JWT on `CONNECT` |

As of 2026-10-03 the backend has `/actuator/health`, `/api/system/*` and the ingestion endpoint; auth (Task 18–20) and the dashboard API are in progress. Use `VITE_USE_MOCKS=true` until they are ready.

## 7. Configuration

| Variable | Example | Notes |
|---|---|---|
| `VITE_API_URL` | *(empty)* | Empty = same origin (prod and dev with proxy). Only set it to point at another backend |
| `VITE_WS_URL` | *(empty)* | Empty = `wss://<current host>/ws` |
| `VITE_CAGE_ID` | `cage-1` | Single pilot cage (the cage `code`) |
| `VITE_USE_MOCKS` | `false` | `true` serves data (and a fake login) from `src/mocks/` |
| `VITE_DEV_BACKEND` | `http://localhost:8080` | Only for the Vite dev proxy |

`VITE_*` variables are baked into the bundle at **build time** (Docker build args) and are public: **never put secrets there**. The dashboard does not use the ingestion API key.

## 8. Build and deployment

- `npm run dev` → Vite dev server on `:5173`, proxying `/api` and `/ws` to the local backend (profile `dev`).
- `npm run build` → `tsc -b && vite build` → `dist/`.
- **Docker image** (multi-stage):

```dockerfile
FROM node:24-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ARG VITE_CAGE_ID=cage-1
ARG VITE_USE_MOCKS=false
RUN npm run build

FROM caddy:2.11-alpine
COPY Caddyfile /etc/caddy/Caddyfile
COPY --from=build /app/dist /srv
EXPOSE 80
```

```caddy
:80 {
    root * /srv
    encode gzip
    try_files {path} /index.html
    file_server
    header /assets/* Cache-Control "public, max-age=31536000, immutable"
}
```

- The image is built and run by `cuy-monitor-backend/infra/docker-compose.yml` (`build: ../../cuy-monitor-dashboard`, no published ports). The main Caddy sends `/` to `dashboard:80` (backend Task 23).
- Update on the EC2: `git -C ../../cuy-monitor-dashboard pull && docker compose up -d --build dashboard`.
- Amplify is no longer used (ADR-011: same domain as the API for auth and WebSocket).

## 9. Quality

| Tool | Purpose |
|---|---|
| TypeScript `strict` | No `any` without a comment explaining why |
| ESLint (typescript-eslint) + Prettier | Style and common bugs |
| Vitest + React Testing Library | Components (StatusBadge, GuineaPigCard, OtpInput), `RequireAuth`, `client.ts` 401 handling, hooks with mocked API |
| Manual check | 360 px width, light and dark mode, offline WebSocket, expired session |

## 10. Decisions

| Decision | Why |
|---|---|
| TypeScript 6.0, not 7.0 | 7.0 has no tooling API yet; typescript-eslint doesn't support it |
| TanStack Query instead of a global store | Almost all state is server state |
| STOMP over WebSocket | Spring speaks it natively; topic per cage |
| CSS Modules + tokens, no UI kit | Small bundle, full control over accessibility and status colors |
| i18next with only `es.json` | Spanish UI now; English is one file away |
| Own login against the backend (no Cognito/Amplify Auth) | One user type; the backend already issues JWTs (backend ADR-011) |
| JWT in `sessionStorage`, not `localStorage` | Gone when the tab closes; 30-min token; no refresh token to protect |
| Served by Caddy on the EC2 instead of Amplify | Same origin for REST, auth and WebSocket → no CORS; everything in Docker on AWS (backend ADR-010/011) |
