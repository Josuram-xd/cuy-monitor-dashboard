# Monitor de Cuyes — dashboard

![Monitor de Cuyes](docs/assets/hero.jpg)

Panel web del **Monitor de Salud de Cuyes**: estado de la jaula en vivo, alertas, registro de cada cuy (raza, pelaje, peso y notas) y la cuenta del usuario. Habla solo con el backend (`cuy-monitor-backend`); nunca con la base de datos.

React + TypeScript + Vite, React Query, CSS Modules con tokens de diseño. Más detalle en [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) y [`docs/DESIGN_SYSTEM.md`](docs/DESIGN_SYSTEM.md).

## Pantallas

| Iniciar sesión | Mis jaulas | Vista de jaula | Historial de alertas |
|---|---|---|---|
| ![Iniciar sesión](docs/screenshots/mobile-login.png) | ![Mis jaulas](docs/screenshots/mobile-cages.png) | ![Vista de jaula](docs/screenshots/mobile-cage.png) | ![Historial de alertas](docs/screenshots/mobile-alerts.png) |

| Modo oscuro: jaula | Modo oscuro: detalle del cuy |
|---|---|
| ![Modo oscuro, jaula](docs/screenshots/mobile-dark-cage.png) | ![Modo oscuro, detalle](docs/screenshots/mobile-dark-guinea-pig.png) |

En escritorio, la jaula con su semáforo (el Composite del backend), los cuyes y las alertas abiertas:

![Vista de jaula en escritorio](docs/screenshots/desktop-cage.png)

| Historial del cuy: estados y comportamiento contra su rango normal | Peso de la jaula, solo lecturas estables |
|---|---|
| ![Historial del cuy](docs/screenshots/desktop-history.png) | ![Peso de la jaula](docs/screenshots/desktop-weight.png) |

Capturas tomadas con `VITE_USE_MOCKS=true`, a 390 px (celular) y 1280 px (escritorio).

## Qué hay en cada pantalla

| Pantalla | Ruta | Qué muestra |
|---|---|---|
| Mis jaulas | `/` | Las jaulas de la cuenta; crear, renombrar y eliminar |
| Vista de jaula | `/cages/:cageId` | Semáforo de la jaula, cuyes con su estado, alertas abiertas y peso (Hoy, 7 días, 30 días) |
| Detalle del cuy | `/cages/:cageId/guinea-pigs/:id` | Datos del cuy, estados de salud en el tiempo y comportamiento contra su rango normal |
| Registrar cuy | `/cages/:cageId/guinea-pigs/new` | Foto, color de marca (los usados quedan deshabilitados), raza, pelaje, peso y notas |
| Alertas | `/alerts` | Abiertas para revisar y el historial con periodo, filtros y "Cargar más" |
| Cuenta | `/account` | Perfil, cambiar contraseña, desactivar la cuenta y cerrar sesión |
| Ajustes | `/settings` | Idioma (español/inglés) y apariencia (claro, oscuro o el del sistema) |

## Comandos

```bash
npm install
npm run dev          # http://localhost:5173, /api y /ws van al backend (VITE_DEV_BACKEND)
npm run test         # vitest
npm run typecheck    # tsc -b
npm run lint         # eslint
npm run build        # tsc -b && vite build
```

Sin backend, `VITE_USE_MOCKS=true npm run dev` sirve datos y un inicio de sesión falsos (cualquier usuario, código `123456`, botón de Google de demostración).

## Variables

Todas son públicas (acaban en el bundle del navegador): nunca pongas secretos. Ver `.env.example`.

| Variable | Para qué |
|---|---|
| `VITE_API_URL`, `VITE_WS_URL` | Vacías = mismo origen (Caddy en producción, proxy de Vite en desarrollo) |
| `VITE_USE_MOCKS` | `true` = datos falsos desde `src/mocks/` |
| `VITE_GOOGLE_CLIENT_ID` | Client ID público de Google para "Continuar con Google"; vacío oculta el botón |

## Despliegue

La imagen del `Dockerfile` compila la SPA y la sirve con Caddy en el puerto 80, detrás del Caddy principal de la EC2 (ver `infra/` del backend).
