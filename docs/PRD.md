# PRD — Dashboard (cuy-monitor-dashboard)

> PRD del componente. El PRD general del producto está en `cuy-monitor-backend/docs/PRD.md`.
> Dueño: Josuram · Última revisión: 26 de septiembre de 2026

## 1. Qué es

La pantalla que usa el criador para saber cómo están sus cuyes. Muestra la jaula, cada cuy con su marca de color y su estado de salud, las alertas en tiempo real, el historial y el peso.

Tiene que ser **entendible para alguien que no es técnico**, en español, y funcionar bien en el celular.

## 2. Usuario principal

**El criador.** Lo abre desde el celular (a veces con sol, a veces con las manos ocupadas) o desde un computador. No sabe qué es una API ni un modelo de IA. Solo quiere saber: *¿algún cuy está mal? ¿cuál? ¿desde cuándo?*

## 3. Pantallas

| Pantalla | Ruta | Qué muestra | Historias |
|---|---|---|---|
| Vista de jaula | `/` | Semáforo general de la jaula + una tarjeta por cuy (nombre, marca de color, estado, "visto hace X min") + últimas alertas | HU-01, HU-02, HU-07 |
| Detalle de cuy | `/guinea-pigs/:id` | Estado actual, línea de tiempo de estados, gráficas de tiempo quieto y visitas al comedero/bebedero | HU-04 |
| Alertas | `/alerts` | Lista de alertas abiertas y revisadas; botón para marcar como revisada | HU-05 |
| Registrar cuy | `/guinea-pigs/new` | Formulario: nombre + color de la marca (solo colores libres en la jaula) | HU-03 |
| Peso | `/weight` (o sección en la vista de jaula) | Gráfica del peso de la jaula en el tiempo | HU-06 |

## 4. Requisitos funcionales

| ID | Requisito | Entrega |
|---|---|---|
| D-01 | Mostrar el estado de cada cuy con color **y** texto **y** ícono (nunca solo color) | Avance |
| D-02 | Semáforo de la jaula con el estado del `CageHealth` | Avance |
| D-03 | Recibir cambios de estado y alertas en vivo por WebSocket, sin recargar la página | Avance (con eventos falsos) |
| D-04 | Indicar si la conexión en vivo está activa o caída | Avance |
| D-05 | Registrar un cuy con nombre y marca de color | Final |
| D-06 | Historial de un cuy con gráficas por rango de fechas | Final |
| D-07 | Listar alertas y marcarlas como revisadas | Final |
| D-08 | Gráfica de peso de la jaula | Final |
| D-09 | Funcionar con datos falsos (`mocks/`) cuando el backend no está | Avance |
| D-10 | Todos los textos en español desde `es.json` | Avance |

## 5. Requisitos no funcionales

- **Mobile-first:** usable en una pantalla de 360 px de ancho.
- **Accesible:** contraste AA como mínimo, estados que no dependan solo del color, botones de al menos 44 px.
- **Rápido:** la vista de jaula carga en menos de 2 s en 4G.
- **Honesto:** si no hay datos o la conexión se cayó, decirlo claramente; nunca mostrar "Normal" por defecto cuando en realidad no se sabe.
- **Idioma:** textos en español, sin jerga técnica ("probabilidad de anomalía 0.81" → "Comportamiento muy distinto a lo normal").

## 6. Fuera de alcance

- Login y usuarios (una sola jaula piloto).
- Notificaciones push al celular.
- Varias jaulas o granjas en la interfaz (aunque los tipos ya llevan `cageId`).
- Ver el video en vivo de la cámara.

## 7. Dependencias

| De | Qué necesita |
|---|---|
| `cuy-monitor-backend` | API REST `/api/**` y WebSocket `/ws` (STOMP, `/topic/cages/{id}`) |
| `cuy-monitor-backend/docs/contracts` | Tipos de datos y enums (`MarkColor`, `HealthStatus`, `AlertStatus`) |
| Backend | CORS habilitado para el dominio de Amplify |

## 8. Criterio de listo para el avance (30 sept)

- Desplegado en AWS Amplify con URL pública.
- Vista de jaula con datos (mock o reales) y textos en español.
- Si el backend ya tiene WebSocket: una alerta falsa aparece sin recargar.

## 9. Documentos relacionados

- Diseño visual: [`DESIGN_SYSTEM.md`](DESIGN_SYSTEM.md)
- Arquitectura: [`ARCHITECTURE.md`](ARCHITECTURE.md)
- Reglas para agentes: [`../AGENTS.md`](../AGENTS.md)
