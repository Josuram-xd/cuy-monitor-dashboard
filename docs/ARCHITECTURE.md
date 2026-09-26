# Architecture — cuy-monitor-dashboard

> React 19.3 · TypeScript 6.0 (strict) · Vite 8 · Node 24 LTS · React Router 8 · TanStack Query 5 · @stomp/stompjs 7 · Recharts 3 · i18next 26
> Hosting: AWS Amplify · Last reviewed: 2026-09-26

## 1. Context

The dashboard is a static single-page app. It has no server of its own: it reads everything from `cuy-monitor-backend` over HTTPS and receives live updates over a STOMP WebSocket.

```
Browser (farmer's phone / PC)
   │
   │  HTTPS  (static files)
   ▼
AWS Amplify ── builds from GitHub main
   
Browser ──REST  https://cuymonitor.duckdns.org/api/**  ──► Caddy ──► backend
Browser ──STOMP wss://cuymonitor.duckdns.org/ws        ──► Caddy ──► backend
             subscribe /topic/cages/{cageId}
```

The dashboard never talks to Postgres or the ai-service directly.

## 2. Folder structure

```
cuy-monitor-dashboard/
├── package.json            "engines": { "node": ">=24" }
├── vite.config.ts
├── tsconfig.json           "strict": true
├── eslint.config.js        typescript-eslint
├── amplify.yml             Amplify build spec
├── .env.example            VITE_API_URL, VITE_WS_URL, VITE_CAGE_ID, VITE_USE_MOCKS
└── src/
    ├── main.tsx            QueryClientProvider, RouterProvider, i18n init
    ├── App.tsx             routes
    ├── i18n/
    │   ├── index.ts        i18next, default and fallback language "es"
    │   └── locales/es.json ALL user-facing text
    ├── types/              GuineaPig.ts, HealthStatus.ts, MarkColor.ts, Alert.ts, CageHealth.ts, WeightReading.ts
    ├── api/
    │   ├── client.ts       fetch wrapper: base URL, JSON, error normalization
    │   ├── cages.ts
    │   ├── guineaPigs.ts
    │   └── alerts.ts
    ├── hooks/              useCageHealth, useGuineaPigs, useGuineaPigHistory, useAlerts (TanStack Query)
    ├── realtime/
    │   └── useLiveCage.ts  STOMP client, subscribes to /topic/cages/{id}, updates the query cache
    ├── pages/              CageOverview, GuineaPigDetail, Alerts, RegisterGuineaPig, Weight
    ├── components/         see DESIGN_SYSTEM.md
    ├── mocks/              fake responses used when VITE_USE_MOCKS=true
    └── styles/             tokens.css, reset.css, global.css
```

## 3. Data flow

### 3.1 Server state (REST)

- All REST data goes through **TanStack Query**. Components never call `fetch` directly.
- One hook per resource in `src/hooks/`, one function per endpoint in `src/api/`.
- Query keys: `['cage', cageId, 'health']`, `['cage', cageId, 'guinea-pigs']`, `['guinea-pig', id, 'history', range]`, `['alerts', status]`, `['cage', cageId, 'weight', range]`.
- Mutations: register guinea pig (`POST`), mark alert reviewed (`PATCH`). On success, invalidate the related keys.

### 3.2 Live updates (WebSocket)

```
backend AlertPublisher ─► WebSocketAlertObserver ─► STOMP /topic/cages/{id}
                                                          │
                                   useLiveCage ◄──────────┘
                                        │
                     ├─ queryClient.setQueryData(...)   update the guinea pig card / cage health
                     ├─ queryClient.invalidateQueries(['alerts'])
                     └─ show AlertToast if level is ALERT or CRITICAL
```

- One STOMP connection for the whole app, opened in a provider at the root.
- Automatic reconnect with backoff (1 s → 30 s max). Connection state is exposed for `LiveIndicator`.
- On reconnect, refetch cage health and alerts (messages may have been missed while offline).
- Message shape is defined in `cuy-monitor-backend/docs/contracts/` (proposed: `{ "type": "STATUS_CHANGED" | "ALERT_CREATED", "cageId", "guineaPigId", ... }` — confirm there before coding).

### 3.3 UI state

Local component state only (`useState`). No global store: TanStack Query already holds server state. Add one only if a real need appears.

## 4. Types and contracts

- `src/types/` mirrors `cuy-monitor-backend/docs/contracts/`. Enums as string-literal unions:

```ts
export type HealthStatus = 'NORMAL' | 'OBSERVED' | 'ALERT' | 'CRITICAL';
export type MarkColor = 'RED' | 'BLUE' | 'GREEN' | 'YELLOW' | 'ORANGE' | 'PURPLE' | 'BLACK' | 'WHITE';
export type AlertStatus = 'OPEN' | 'REVIEWED';
```

- `UNKNOWN` is a UI-only status (`type DisplayStatus = HealthStatus | 'UNKNOWN'`), never sent to the backend.
- Timestamps arrive as ISO-8601 UTC strings and are formatted in the UI with the `es-CO` locale.

## 5. Backend endpoints used

| Screen | Endpoint |
|---|---|
| CageOverview | `GET /api/cages/{id}/health`, `GET /api/cages/{id}/guinea-pigs`, `GET /api/alerts?status=OPEN` |
| GuineaPigDetail | `GET /api/guinea-pigs/{id}/history?from=&to=` |
| Alerts | `GET /api/alerts?status=`, `PATCH /api/alerts/{id}` |
| RegisterGuineaPig | `POST /api/cages/{id}/guinea-pigs` |
| Weight | `GET /api/cages/{id}/weight?from=&to=` |
| All | `WS /ws` → `/topic/cages/{id}` |

As of 2026-09-26 only `/actuator/health` and `/api/system/*` exist in the backend; the rest are planned. Use `VITE_USE_MOCKS=true` until they are ready.

## 6. Configuration

| Variable | Example | Notes |
|---|---|---|
| `VITE_API_URL` | `https://cuymonitor.duckdns.org` | No trailing slash |
| `VITE_WS_URL` | `wss://cuymonitor.duckdns.org/ws` | |
| `VITE_CAGE_ID` | `cage-1` | Single pilot cage |
| `VITE_USE_MOCKS` | `false` | `true` serves data from `src/mocks/` |

`VITE_*` variables end up in the public JS bundle: **never put secrets there**. The dashboard does not use the ingestion API key.

## 7. Build and deployment

- `npm run dev` → Vite dev server. `npm run build` → `tsc -b && vite build` → `dist/`.
- AWS Amplify app connected to `main`, Node 24. Env vars set in the Amplify console.
- SPA rewrite rule in Amplify: `</^[^.]+$|\.(?!(css|gif|ico|jpg|js|png|txt|svg|woff|woff2|ttf|map|json)$)([^.]+$)/>` → `/index.html` (200).
- The backend must allow the Amplify domain in CORS (`CorsConfig`) and in the WebSocket allowed origins.

## 8. Quality

| Tool | Purpose |
|---|---|
| TypeScript `strict` | No `any` without a comment explaining why |
| ESLint (typescript-eslint) + Prettier | Style and common bugs |
| Vitest + React Testing Library | Components (StatusBadge, GuineaPigCard) and hooks with mocked API |
| Manual check | 360 px width, light and dark mode, offline WebSocket |

## 9. Decisions

| Decision | Why |
|---|---|
| TypeScript 6.0, not 7.0 | 7.0 has no tooling API yet; typescript-eslint doesn't support it |
| TanStack Query instead of a global store | Almost all state is server state |
| STOMP over WebSocket | Spring speaks it natively; topic per cage |
| CSS Modules + tokens, no UI kit | Small bundle, full control over accessibility and status colors |
| i18next with only `es.json` | Spanish UI now; English is one file away |
