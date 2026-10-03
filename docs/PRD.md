# PRD — Dashboard (cuy-monitor-dashboard)

> PRD del componente. El PRD general del producto está en `cuy-monitor-backend/docs/PRD.md`.
> Última revisión: 3 de octubre de 2026

## 1. Qué es

La pantalla que usa el criador para saber cómo están sus cuyes. Muestra la jaula, cada cuy con su marca de color y su estado de salud, las alertas en tiempo real, el historial y el peso.

Para verla hay que **tener cuenta e iniciar sesión**. Hay un solo tipo de usuario: el que mira el dashboard. No hay administrador ni permisos distintos; todos los usuarios ven la misma jaula piloto.

Tiene que ser **entendible para alguien que no es técnico**, en español, y funcionar bien en el celular.

## 2. Usuario principal

**El criador.** Lo abre desde el celular (a veces con sol, a veces con las manos ocupadas) o desde un computador. No sabe qué es una API ni un modelo de IA. Solo quiere saber: *¿algún cuy está mal? ¿cuál? ¿desde cuándo?*

Entrar tiene que ser simple: usuario, contraseña y un código de 6 dígitos que le llega al correo.

## 3. Pantallas

### Públicas (sin sesión)

| Pantalla | Ruta | Qué muestra | Historias |
|---|---|---|---|
| Iniciar sesión | `/login` | Usuario + contraseña, enlace "¿No tienes cuenta? Regístrate" | HU-10 |
| Crear cuenta | `/register` | Usuario, nombre completo, correo, contraseña (con la regla de 8 a 72 caracteres a la vista) | HU-09 |
| Código de verificación | `/verify` | 6 casillas para el código que llegó al correo, a qué correo se mandó (oculto en parte), tiempo restante, "Reenviar código" | HU-09, HU-10 |

### Privadas (con sesión)

| Pantalla | Ruta | Qué muestra | Historias |
|---|---|---|---|
| Vista de jaula | `/` | Semáforo general de la jaula + una tarjeta por cuy (nombre, marca de color, estado, "visto hace X min") + últimas alertas | HU-01, HU-02, HU-07 |
| Detalle de cuy | `/guinea-pigs/:id` | Estado actual, línea de tiempo de estados, gráficas de tiempo quieto y visitas al comedero/bebedero | HU-04 |
| Alertas | `/alerts` | Lista de alertas abiertas y revisadas; botón para marcar como revisada | HU-05 |
| Registrar cuy | `/guinea-pigs/new` | Formulario: nombre + color de la marca (solo colores libres en la jaula) | HU-03 |
| Peso | `/weight` (o sección en la vista de jaula) | Gráfica del peso de la jaula en el tiempo | HU-06 |
| Mi cuenta | `/account` | Nombre, usuario, correo; editar nombre; cambiar contraseña; desactivar cuenta; **Cerrar sesión** | HU-11, HU-12 |

Si alguien entra a una ruta privada sin sesión, va a `/login` y, después de entrar, vuelve a donde quería ir.

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
| D-09 | Funcionar con datos falsos (`mocks/`) cuando el backend no está, incluido un login falso | Avance |
| D-10 | Todos los textos en español desde `es.json` | Avance |
| D-11 | Crear cuenta y confirmarla con el código que llega al correo | Final |
| D-12 | Iniciar sesión en dos pasos (usuario + contraseña → código) | Final |
| D-13 | Proteger todas las pantallas privadas; sin sesión, ir a `/login` | Final |
| D-14 | Mandar la sesión en cada pedido al backend y en la conexión en vivo | Final |
| D-15 | Cerrar sesión desde cualquier pantalla privada (menú de usuario) y automáticamente cuando la sesión vence (30 min) | Final |
| D-16 | Mi cuenta: ver datos, cambiar nombre, cambiar contraseña, desactivar cuenta (con confirmación) | Final |
| D-17 | Mensajes de error claros y sin revelar si un usuario existe ("Usuario o contraseña incorrectos") | Final |

## 5. Requisitos no funcionales

- **Mobile-first:** usable en una pantalla de 360 px de ancho.
- **Accesible:** contraste AA como mínimo, estados que no dependan solo del color, botones de al menos 44 px, formularios con etiquetas visibles.
- **Rápido:** la vista de jaula carga en menos de 2 s en 4G.
- **Honesto:** si no hay datos o la conexión se cayó, decirlo claramente; nunca mostrar "Normal" por defecto cuando en realidad no se sabe.
- **Idioma:** textos en español, sin jerga técnica ("probabilidad de anomalía 0.81" → "Comportamiento muy distinto a lo normal"; "OTP" → "código de verificación").
- **Seguro:** la sesión se borra al cerrar la pestaña o al cerrar sesión; nada de secretos en el bundle.
- **Despliegue:** imagen Docker servida detrás del Caddy de la EC2, mismo dominio que la API.

## 6. Fuera de alcance

- Roles o administrador (un solo tipo de usuario).
- Recuperar contraseña olvidada y cambiar el correo (mejora futura).
- "Recordarme" / sesiones de más de 30 min.
- Notificaciones push al celular.
- Varias jaulas o granjas en la interfaz (aunque los tipos ya llevan `cageId`).
- Ver el video en vivo de la cámara.

## 7. Dependencias

| De | Qué necesita |
|---|---|
| `cuy-monitor-backend` | API de auth `/api/auth/**` y `/api/users/me` (Task 18, 19) |
| `cuy-monitor-backend` | API REST `/api/**` con JWT y WebSocket `/ws` (STOMP, `/topic/cages/{id}`, token en el `CONNECT`, Task 20) |
| `cuy-monitor-backend/docs/contracts` | Tipos de datos y enums (`MarkColor`, `HealthStatus`, `AlertStatus`, `UserStatus`) y `auth-api.md` |
| `cuy-monitor-backend/infra` | Servicio `dashboard` en Compose y ruta `/` en Caddy (Task 23) |

## 8. Criterio de listo

**Avance (30 sept):** vista de jaula con datos (mock o reales) y textos en español; si el backend ya tiene WebSocket, una alerta falsa aparece sin recargar.

**Final:**
- Corriendo en `https://cuymonitor.duckdns.org/` desde la imagen Docker.
- Sin sesión no se ve ningún dato; registro, código y login funcionan con un correo real.
- Al cerrar sesión o al vencer, vuelve a `/login` y no queda nada en pantalla.

## 9. Documentos relacionados

- Diseño visual: [`DESIGN_SYSTEM.md`](DESIGN_SYSTEM.md)
- Arquitectura: [`ARCHITECTURE.md`](ARCHITECTURE.md)
- Reglas para agentes: [`../AGENTS.md`](../AGENTS.md)
