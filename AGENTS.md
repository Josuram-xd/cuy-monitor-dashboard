# AGENTS.md — cuy-monitor-dashboard

Instrucciones para cualquier agente de IA que trabaje en este repo. Léelas completas antes de tocar código.

## Qué es este repo

El dashboard del Monitor de Salud de Cuyes: **React 19 + TypeScript 6 + Vite 8**. Lo usa el criador (no técnico, en español, desde el celular) para ver el estado de cada cuy, las alertas en vivo, el historial y el peso. Se despliega en AWS Amplify.

Lee antes de trabajar:
- `docs/PRD.md` — pantallas y requisitos.
- `docs/DESIGN_SYSTEM.md` — colores, tipografía, componentes, textos. **Obligatorio antes de tocar cualquier UI.**
- `docs/ARCHITECTURE.md` — carpetas, flujo de datos, endpoints.
- `cuy-monitor-backend/docs/contracts/` — tipos y enums (fuente de verdad).

## Comandos

```bash
npm install
npm run dev          # servidor de desarrollo
npm run build        # tsc + vite build (tiene que pasar sin errores)
npm run lint         # ESLint
npm run test         # Vitest
```

Node 24 LTS. No cambies de gestor de paquetes (npm).

## Regla de idioma (la más importante)

- **Código en inglés:** componentes, props, hooks, tipos, variables, archivos, carpetas, claves de i18n, comentarios, commits.
- **Todo texto que ve el usuario en español**, y **solo** en `src/i18n/locales/es.json`. Se usa con `t('clave')`.
- **Prohibido** escribir texto visible directo en el JSX: ni `"Guardar"`, ni `"Normal"`, ni `aria-label="Cerrar"`. Todo por `t()`.
- Nunca mostrar al criador palabras técnicas: "probAnomaly", "event", "API", "WebSocket", códigos de error crudos.

## Reglas de diseño

- Usa **solo tokens** de `src/styles/tokens.css`. Nada de colores hex, tamaños o sombras sueltos en los componentes.
- El estado de salud siempre con **color + ícono + texto** (`StatusBadge`). Nunca solo color.
- La marca de color siempre con `MarkColorDot` + nombre.
- Verde, amarillo, naranja y rojo están reservados para estados de salud. No los uses para decorar.
- Si no hay datos o se cayó la conexión, muestra `UNKNOWN` / "Sin datos". Nunca "Normal" por defecto.
- Mobile-first: todo tiene que funcionar en 360 px de ancho. Botones de mínimo 44 px.
- Antes de inventar un componente nuevo, revisa si ya existe en `DESIGN_SYSTEM.md`.

## Reglas de código

- TypeScript `strict`. No uses `any`; si es inevitable, deja un comentario explicando por qué.
- Los tipos en `src/types/` copian los contratos del backend. Si no coinciden, **el backend manda**: avísale al usuario en vez de "arreglar" el tipo a tu gusto.
- Datos del servidor siempre con TanStack Query (hooks en `src/hooks/`). Nada de `fetch` dentro de componentes.
- Una sola conexión STOMP para toda la app (en `src/realtime/`).
- Componentes: una carpeta por componente con `Name.tsx` + `Name.module.css`.
- Mientras el backend no tenga un endpoint, usa `src/mocks/` con `VITE_USE_MOCKS=true`. No inventes endpoints que no están en los contratos.

## Seguridad

- Las variables `VITE_*` quedan públicas en el bundle. **Nunca** pongas ahí API keys ni secretos.
- El dashboard **no** usa la `API_KEY` de ingesta del backend.
- No hagas commit de `.env` ni `.env.local`; solo `.env.example`.

## Tests y verificación

- Antes de decir que terminaste: `npm run build`, `npm run lint` y `npm run test` sin errores.
- Componentes con lógica visible (`StatusBadge`, `GuineaPigCard`, `AlertList`) con test en Vitest + Testing Library.
- Revisa a mano en 360 px y en modo oscuro si tocaste UI.

## Git

- Conventional Commits en inglés: `feat(cage): add live status updates`, `fix(alerts): keep reviewed alerts collapsed`, `style(tokens): adjust observed contrast`.
- Ramas `feature/...`, `fix/...`.
- `main` solo por Pull Request (Amplify despliega automáticamente desde `main`).
- **Prohibido** `git push --force` a `main`.

## Lo que el agente NO debe hacer sin permiso explícito

- Agregar librerías de UI (MUI, Chakra, Tailwind, shadcn…) o de estado global (Redux, Zustand).
- Subir TypeScript a 7.x o React/Vite de versión mayor.
- Cambiar la configuración de Amplify o `amplify.yml`.
- Cambiar tokens del sistema de diseño (propón el cambio y espera confirmación).
- Hacer push o abrir PRs.

## Dueño

Todo el repo: **Josuram**. El compañero revisa los PRs.

## Herramientas que puede usar el agente

- Leer y editar archivos del repo.
- Correr `npm run dev|build|lint|test`.
- `git status`, `git diff`, `git log`, ramas y commits locales.
- Instalar dependencias **solo** si ya están listadas en `docs/ARCHITECTURE.md` (React Router, TanStack Query, stompjs, Recharts, i18next); cualquier otra, preguntar primero.
