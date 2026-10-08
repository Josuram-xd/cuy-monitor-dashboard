# TASKS — cuy-monitor-dashboard

> Lista de trabajo del dashboard. Cada subtarea = **un commit**: usa el mensaje que está entre comillas invertidas.
> ⛔ Los commits, push y PRs los hace una persona del equipo. **Ningún agente de IA hace commit ni push, aunque se lo pidan**, y nunca se agrega `Co-Authored-By` ni firmas de IA (ver `AGENTS.md`).
> Marca `[x]` cuando hagas push. Una rama por Task: `feature/task-3-base-components`, etc.
> Cada PR lo revisa el otro integrante antes de mergear a `main`.
> **Login:** todas las pantallas con datos van detrás de inicio de sesión (Task 13–14). Hay un solo tipo de usuario.
> **Despliegue:** imagen Docker servida por el Caddy de la EC2, mismo dominio que la API (ya no Amplify).

| Símbolo | Significado |
|---|---|
| 🔴 Prioridad 1 | Crítico: lo que se muestra en el avance |
| 🟠 Prioridad 2 | Importante: lo que pide la entrega final |
| 🟢 Prioridad 3 | Cierre: calidad y detalles |
| 🔗 Depende de | Antes hay que terminar esas tasks (de este u otro repo) |

---

## 🔴 Prioridad 1 — Avance (hasta el 30 de septiembre)

### Task 1 — Proyecto base

- [x] **Task 1.1** — `chore: scaffold Vite 8 + React 19 + TypeScript 6 project`
  `npm create vite@latest` (React + TS), `"engines": { "node": ">=24" }`.
- [x] **Task 1.2** — `chore: configure strict TypeScript, ESLint and Prettier`
- [x] **Task 1.3** — `docs: add PRD, DESIGN_SYSTEM, ARCHITECTURE and AGENTS`
- [x] **Task 1.4** — `feat(i18n): set up i18next with es.json as default language`
- [x] **Task 1.5** — `feat(styles): add design tokens, reset and global styles`
  `src/styles/tokens.css` con los colores, tipografía y espaciado del Design System.
- [x] **Task 1.6** — `chore: add env example with API and WebSocket URLs`
  `VITE_API_URL` y `VITE_WS_URL` vacíos = mismo dominio; `VITE_DEV_BACKEND` para el proxy de Vite.

### Task 2 — Tipos y capa de datos

🔗 **Depende de:** seguir con las Task 3.2–3.4 del repo `cuy-monitor-backend` (contratos)

- [x] **Task 2.1** — `feat(types): add HealthStatus, MarkColor, AlertStatus and domain types`
- [x] **Task 2.2** — `feat(api): add fetch client with base URL and error handling`
- [x] **Task 2.3** — `feat(mocks): add fake cage, guinea pigs and alerts data`
- [x] **Task 2.4** — `feat(api): add cages, guinea pigs and alerts endpoints with mock switch`
  `VITE_USE_MOCKS=true` devuelve los mocks.
- [x] **Task 2.5** — `feat(hooks): add TanStack Query hooks for cage health, guinea pigs and alerts`

### Task 3 — Componentes base

- [x] **Task 3.1** — `feat(ui): add StatusBadge with icon and label`
- [x] **Task 3.2** — `feat(ui): add MarkColorDot`
- [x] **Task 3.3** — `feat(ui): add GuineaPigCard`
- [x] **Task 3.4** — `feat(ui): add CageStatusBanner`
- [x] **Task 3.5** — `feat(ui): add EmptyState, ErrorState and skeleton loaders`
- [x] **Task 3.6** — `feat(ui): add Button variants`
- [x] **Task 3.7** — `test(ui): cover StatusBadge and GuineaPigCard`

### Task 4 — Vista de jaula (con mocks)

- [ ] **Task 4.1** — `feat(router): add routes and app layout with bottom navigation`
- [ ] **Task 4.2** — `feat(cage): add CageOverview page with banner and guinea pig grid`
- [ ] **Task 4.3** — `feat(alerts): add AlertList with latest open alerts on CageOverview`
- [ ] **Task 4.4** — `build: add Dockerfile and Caddyfile serving the SPA`
  Multi-stage `node:24-alpine` → `caddy:2.11-alpine`, `try_files {path} /index.html`, puerto 80, `.dockerignore`. Variables `VITE_*` como build args.
- [ ] **Task 4.5** — *(sin commit)* clonar el repo al lado del backend en la EC2 y levantarlo con Compose
  🔗 Depende de: `cuy-monitor-backend` Task 23 (servicio `dashboard` y ruta `/` en Caddy)

### Task 5 — Conectar al backend real

🔗 **Depende de:** seguir con las Task 8.1–8.4 del repo `cuy-monitor-backend`

- [ ] **Task 5.1** — `feat(api): switch cage and guinea pigs data to the real API`
- [ ] **Task 5.2** — `feat(api): switch alerts to the real API`
- [ ] **Task 5.3** — *(sin commit)* construir la imagen con `VITE_USE_MOCKS=false` y verificar en el celular

### Task 6 — Actualizaciones en vivo

🔗 **Depende de:** seguir con las Task 7.3–7.4 del repo `cuy-monitor-backend`

- [ ] **Task 6.1** — `feat(realtime): add STOMP client provider with auto reconnect`
- [ ] **Task 6.2** — `feat(realtime): update cage cache from /topic/cages/{id} messages`
- [ ] **Task 6.3** — `feat(ui): add LiveIndicator`
- [ ] **Task 6.4** — `feat(ui): add AlertToast for ALERT and CRITICAL`
- [ ] **Task 6.5** — *(sin commit)* probar con el fake producer (`cuy-monitor-backend` Task 9) que una alerta aparece sin recargar

---

## 🟠 Prioridad 2 — Entrega final (octubre)

### Task 7 — Registrar cuy

🔗 **Depende de:** `cuy-monitor-backend` Task 8.3

- [ ] **Task 7.1** — `feat(form): add mark color picker with used colors disabled`
- [ ] **Task 7.2** — `feat(guinea-pig): add RegisterGuineaPig page`
- [ ] **Task 7.3** — `feat(guinea-pig): add form validation and error messages`

### Task 8 — Página de alertas

🔗 **Depende de:** `cuy-monitor-backend` Task 13.3

- [ ] **Task 8.1** — `feat(alerts): add Alerts page with open and reviewed sections`
- [ ] **Task 8.2** — `feat(alerts): mark alert as reviewed`

### Task 9 — Detalle de cuy

🔗 **Depende de:** `cuy-monitor-backend` Task 13.1

- [ ] **Task 9.1** — `feat(guinea-pig): add GuineaPigDetail page with current status`
- [ ] **Task 9.2** — `feat(charts): add BehaviorChart with normal range and status bands`
- [ ] **Task 9.3** — `feat(charts): add state timeline`
- [ ] **Task 9.4** — `feat(charts): add date range selector (today, 7 days, 30 days)`

### Task 10 — Peso

🔗 **Depende de:** `cuy-monitor-backend` Task 13.2 (y datos reales de `cuy-monitor-arduino` Task 5)

- [ ] **Task 10.1** — `feat(charts): add WeightChart with stable readings only`
- [ ] **Task 10.2** — `feat(weight): add weight section to the cage view`

---

## 🔐 Inicio de sesión y cuenta (octubre)

Un solo tipo de usuario, sin roles. Flujo y reglas en `docs/ARCHITECTURE.md` sección 3 y componentes en `docs/DESIGN_SYSTEM.md` (`AuthLayout`, `PasswordField`, `OtpInput`, `UserMenu`, `SessionNotice`). Contrato: `cuy-monitor-backend/docs/contracts/auth-api.md`.

### Task 13 — Registro, login con código y sesión

Rama: `feature/task-13-auth`. Se puede avanzar con mocks (cualquier usuario, código `123456`) antes de que el backend termine.
🔗 **Depende de:** `cuy-monitor-backend` Task 18 (para conectar con el backend real, Task 13.11)

- [ ] **Task 13.1** — `feat(types): add User, UserStatus and auth types`
- [ ] **Task 13.2** — `feat(auth): add token storage, AuthProvider and useAuth`
  `sessionStorage` + memoria, cierre automático al llegar `expiresAt`, `logout(reason)`.
- [ ] **Task 13.3** — `feat(api): send Bearer token and log out on 401`
  En `client.ts`; mapear códigos de error del backend a claves de `es.json`.
- [ ] **Task 13.4** — `feat(auth): add RequireAuth and public/private routes`
  Redirige a `/login?next=...`; con sesión, `/login` manda a `/`.
- [ ] **Task 13.5** — `feat(ui): add AuthLayout, PasswordField, OtpInput and SessionNotice`
- [ ] **Task 13.6** — `feat(realtime): open STOMP only with a session and send the token on CONNECT`
  🔗 Depende de: `cuy-monitor-backend` Task 20
- [ ] **Task 13.7** — `feat(auth): add Login, Register and VerifyCode pages`
  Con reenvío de código, cuenta regresiva y mensajes de `DESIGN_SYSTEM.md` sección 5.
- [ ] **Task 13.8** — `feat(mocks): add fake auth endpoints`
- [ ] **Task 13.9** — `feat(ui): add UserMenu with logout`
  Cerrar sesión: borra el token, `queryClient.clear()`, desconecta STOMP, va a `/login`.
- [ ] **Task 13.10** — `test(auth): cover RequireAuth, OtpInput and 401 handling`
- [ ] **Task 13.11** — *(sin commit)* probar contra el backend real con un correo de verdad: registro → código → vista de jaula → cerrar sesión

### Task 14 — Mi cuenta

Rama: `feature/task-14-account`.
🔗 **Depende de:** Task 13 · `cuy-monitor-backend` Task 19

- [ ] **Task 14.1** — `feat(api): add account endpoints and useMe hook`
- [ ] **Task 14.2** — `feat(account): add Account page with profile and logout`
- [ ] **Task 14.3** — `feat(account): change password form`
- [ ] **Task 14.4** — `feat(account): deactivate account with password confirmation`
  Botón `danger` + diálogo; al terminar, cierra la sesión con el aviso "Tu cuenta fue desactivada".
- [ ] **Task 14.5** — `feat(router): add Cuenta tab to the bottom navigation`
- [ ] **Task 14.6** — `test(account): cover profile update, password change and deactivation`

---

## 🟢 Prioridad 3 — Cierre (noviembre)

### Task 11 — Calidad

- [ ] **Task 11.1** — `feat(styles): add dark mode tokens`
- [ ] **Task 11.2** — `fix(a11y): apply accessibility checklist from the design system`
- [ ] **Task 11.3** — `test: cover hooks and pages with mocked API`
- [ ] **Task 11.4** — `perf: lazy load detail and chart pages`

### Task 12 — Entrega

- [ ] **Task 12.1** — `docs: update README with screenshots and setup`
- [ ] **Task 12.2** — *(sin commit)* revisar todos los textos de `es.json` con alguien no técnico (la tía), incluido el registro y el login
