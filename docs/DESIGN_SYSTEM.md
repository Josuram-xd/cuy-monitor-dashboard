# Design System — cuy-monitor-dashboard

> Visual language, UI components and design rules for the farmer-facing dashboard.
> Stack: React 19 · TypeScript 6 · Vite 8 · CSS Modules + CSS custom properties · Recharts 3 · i18next
> Last reviewed: 2026-10-03 (adds login, registration, verification code and account screens)

---

## 1. Principles

1. **Status first.** The first thing a farmer sees is whether any guinea pig needs attention. Everything else is secondary.
2. **Never color alone.** Every health status is shown with color **+ icon + text**. Mark colors are always shown with their name.
3. **Plain Spanish.** No technical words on screen (no "probAnomaly", "event", "API"). All text lives in `src/i18n/locales/es.json`.
4. **Honest about uncertainty.** If there is no data or the live connection is down, say so. Unknown is never displayed as "Normal".
5. **Mobile-first, outdoor-friendly.** Designed for a 360 px phone in daylight: high contrast, large tap targets, few elements per screen.
6. **Alive, but status still wins.** The brand is green and the interface reacts to the user (hover lift, press feedback, cards that come in one after another, a live dot that pulses). Within a card the strongest color is still the status: `ALERT` and `CRITICAL` look unmistakably louder than a healthy cage.
7. **Getting in is easy.** Login, registration and the verification code are short, forgiving forms with big fields; errors say what to do, never blame the user and never reveal whether an account exists.

---

## 2. Design tokens

All tokens are CSS custom properties in `src/styles/tokens.css`. Components never use raw hex values.

### 2.1 Color — brand and neutrals

| Token | Light | Dark | Use |
|---|---|---|---|
| `--color-primary` | `#2D6A4F` | `#7FB89B` | Primary buttons, links, main chart series |
| `--color-primary-hover` | `#1B4332` | `#A3D1B8` | Hover/pressed, end of the brand gradient |
| `--color-primary-soft` | `#E4EFE8` | `#1F3329` | Tinted hover backgrounds, icon circles |
| `--color-accent` | `#52796F` | `#8FB5AA` | Secondary green: input hover, eyebrow text, dashed borders |
| `--gradient-brand` | `#3A7D5F → #2D6A4F → #1B4332` | same | Header, primary buttons, auth panel, logo tile |
| `--color-bg` | `#F7F5F0` | `#121714` | Page background (warm off-white) |
| `--color-surface` | `#FFFFFF` | `#1C221F` | Cards, panels |
| `--color-border` | `#D6D3CD` | `#2E3631` | Card borders, dividers |
| `--color-text` | `#1C1917` | `#ECEFED` | Main text |
| `--color-text-muted` | `#6B6560` | `#9AA39E` | Secondary text, timestamps |
| `--color-focus` | `#2D6A4F` | `#7FB89B` | Focus ring (2 px + 2 px offset) |

The brand is green (PencilPlaybook palette). It shares the hue with the `NORMAL` status, so a status is **never** shown by color alone: it always carries its icon and its word, and `NORMAL` uses a brighter green accent (`#16A34A`) than the brand. `--color-text-muted` is `#6B6560` instead of the playbook's `#78716C` to keep 4.5:1 on the warm background.

### 2.2 Color — health status

| Status | Spanish label (es.json) | Icon | `--status-*-fg` | `--status-*-bg` | `--status-*-accent` |
|---|---|---|---|---|---|
| `NORMAL` | Normal | check-circle | `#1F7A3D` | `#E6F4EA` | `#16A34A` |
| `OBSERVED` | En observación | eye | `#8A6100` | `#FFF4CC` | `#F2B705` |
| `ALERT` | Alerta | alert-triangle | `#B24A00` | `#FFE8D6` | `#F07F13` |
| `CRITICAL` | Crítico | alert-octagon | `#B3261E` | `#FDE7E7` | `#D93025` |
| `UNKNOWN` (no data) | Sin datos | help-circle | `#414851` | `#F2F4F6` | `#9AA3AF` |

- `fg` on `bg` meets WCAG AA (≥ 4.5:1) for text.
- `accent` is only for non-text marks: the left border of a card, chart bands, the cage traffic light.
- `UNKNOWN` is a UI-only state (not in the backend enum) used when a guinea pig has not been seen recently or data failed to load.

### 2.3 Color — guinea pig marks (`MarkColor`)

Mark colors identify **which** guinea pig it is. They are not status.

| `MarkColor` | Label (es.json) | Swatch |
|---|---|---|
| `RED` | Rojo | `#D62828` |
| `BLUE` | Azul | `#1E63D6` |
| `GREEN` | Verde | `#2E9E44` |
| `YELLOW` | Amarillo | `#F5C518` |
| `ORANGE` | Naranja | `#F77F00` |
| `PURPLE` | Morado | `#7B3FB5` |
| `BLACK` | Negro | `#1A1A1A` |
| `WHITE` | Blanco | `#FFFFFF` |

Rules: always render as `MarkColorDot` (a circle with a 1 px `--color-border` ring so white and black are visible on any surface) **next to the color name**. Never tint a whole card with the mark color.

### 2.4 Typography

System font stack (no web fonts to download on slow rural connections):

```css
--font-sans: system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
--font-mono: ui-monospace, "SF Mono", Consolas, monospace;
```

| Token | Size / line height | Weight | Use |
|---|---|---|---|
| `--text-display` | 28 / 34 px | 700 | Cage status headline |
| `--text-h1` | 22 / 28 px | 700 | Page title |
| `--text-h2` | 18 / 24 px | 600 | Section title, card title (guinea pig name) |
| `--text-body` | 16 / 24 px | 400 | Default text |
| `--text-small` | 14 / 20 px | 400 | Metadata, timestamps |
| `--text-caption` | 12 / 16 px | 500 | Chart axes, legends |

- Minimum body size on mobile is 16 px.
- Numbers use `font-variant-numeric: tabular-nums` so they don't jump when they update live.

### 2.5 Spacing, radius, elevation

| Token | Value |
|---|---|
| `--space-1` … `--space-8` | 4, 8, 12, 16, 24, 32, 48, 64 px |
| `--radius-sm` / `--radius-md` / `--radius-lg` / `--radius-full` | 6 / 10 / 16 / 9999 px |
| `--shadow-card` | `0 1px 2px rgb(27 67 50 / 0.06), 0 4px 14px rgb(27 67 50 / 0.07)` |
| `--shadow-lift` | `0 12px 30px rgb(27 67 50 / 0.18)` (hovered cards and buttons, auth card) |
| `--shadow-overlay` | `0 8px 24px rgb(27 67 50 / 0.2)` (toasts, dialogs, menus) |
| `--ring-focus` | `0 0 0 4px rgb(45 106 79 / 0.18)` (soft glow around a focused field) |

### 2.6 Layout and breakpoints

| Name | Min width | Guinea pig grid |
|---|---|---|
| mobile (default) | 0 | 1 column |
| `--bp-tablet` | 640 px | 2 columns |
| `--bp-desktop` | 1024 px | 3–4 columns, alerts panel on the right |

- Page padding: 16 px on mobile, 24 px from tablet.
- Max content width: 1200 px.
- Bottom navigation bar on mobile (Jaula · Alertas · Registrar · Cuenta); top bar from tablet, with `UserMenu` on the right.
- Public screens (login, registration, code) use `AuthLayout`: no navigation bar, single centered column, max width 400 px.

### 2.7 Motion

- Default transition: 150 ms `ease-out` (hover, focus, badge color change). Lifts use `--transition-lift` (220 ms).
- Entrance: cards, the cage banner and the auth card rise 14 px while fading in (`--rise-duration`, 360 ms); guinea pig cards are staggered 70 ms each.
- The live dot pulses while the connection is up and the logo breathes on the loading screen. Everything else is still.
- A guinea pig whose status just went up gets a single 600 ms highlight pulse on its card. No looping animations.
- Respect `prefers-reduced-motion: reduce` (disable the pulse).

### 2.8 Dark mode

Supported through `prefers-color-scheme` by redefining the tokens in section 2.1. Status `fg`/`bg` pairs have dark variants defined in `tokens.css` with the same contrast rule. Light mode is the default and the one tested in daylight.

---

## 3. Components

All components live in `src/components/`, one folder per component with `Component.tsx` + `Component.module.css`. Props in English, visible text via `t()`.

### Playful layer: Mascot, Wave, Drifters, Reveal, CountUp

The app is friendly on purpose, without changing the palette. Titles and buttons use **Fredoka** (round, chunky), text uses **Nunito**; both come from `@fontsource-variable/*`, so the page makes no request to Google Fonts. Radii are larger (`--radius-lg` 24px), buttons are pills that bounce (`--ease-bounce`) and cards lift and tilt on hover. Pastel accents (`--pastel-*`) are decoration only: **status is still carried by the status tokens, the badge and the text**.

- **Mascot** (`mood`: `happy`, `worried`, `alarm`, `sleepy`): "Cuchi". Its face follows the worst status of the cage in `CageStatusBanner` (NORMAL happy, OBSERVED worried, ALERT/CRITICAL alarm, unknown sleepy), and it greets in the login hero, empty states, 404 and the session loader. Decorative unless a `label` is given; the mood is never the only signal.
- **Wave**: soft wavy edge. Under the header it continues the header's left-to-right gradient (`--header-from` / `--header-to`); under the login hero on phones it is the page color.
- **Drifters**: translucent clouds drifting behind a green section.
- **Reveal**: fades and lifts its content the first time it scrolls into view (`delay` staggers a row). Without `IntersectionObserver` the content is just visible.
- **CountUp**: a number that counts to its value; the real value is always the accessible text.
- **AppBackdrop**: a fixed picture behind every private page (blobs of pastel color, clouds, leaves, paws and carrots at different depths). Scrolling and moving the mouse shift the layers by different amounts (parallax, through `--scroll`, `--mx` and `--my`) and every piece also drifts on its own. It ignores pointer events, is hidden from screen readers and stands still with `prefers-reduced-motion`.
- **GuineaPigCard** shows an avatar: the initial inside a ring of the coat color.
- Everything that moves is switched off by `prefers-reduced-motion` (global rule in `global.css` plus each animation).

### AppFooter and HowItWorks

The footer closes every private page: green with the same left-to-right gradient as the header (`--header-from` / `--header-to`) and a wave on top. It has the links (**Cómo funciona**, Jaula, Alertas, Registrar, Cuenta), the name of the app with its logo and the copyright line. `HowItWorks` (`/how-it-works`) explains the app in four steps (the mark of color, the cage that watches and listens, the AI that analyses it, the panel) with the mascot; it describes the product and offers to register a cuy or see the cage.

### GuineaPigDetail (page `/guinea-pigs/:id`)

What opens when the card of a cuy is clicked. It reads the list the cage page already loaded, so it needs no new endpoint: a hero with the avatar ring (coat color around the initial), the name, the status badge and since when; "Datos" with breed, coat, weight on arrival and mark (each one says "Sin dato" if it was not filled in) and the notes; the alerts of that cuy (the same `AlertList` as the cage page); and a dashed card that says the behavior and weight history is still to come. An unknown or deleted id shows an empty state with the way back. `AppLayout` renders `ScrollRestoration`, so every page opens at the top.

### DeleteGuineaPig

A small trash button in the bottom right corner of each cuy card (outside the link that opens the cuy). It never deletes by itself: it opens a `ConfirmDialog` ("¿Eliminar a Canela?") that says the cuy leaves the cage, its mark color is free again and its history is kept. The delete is a soft delete on the server. The grid, the counter and the cage summary refresh afterwards; a 404 (already gone) is explained in the dialog.

### GoogleButton / GoogleSignIn

"Continuar con Google" under the login and register forms, after an "o" divider. With `VITE_GOOGLE_CLIENT_ID` it is Google's own button (Google Identity Services draws it; the page only receives a signed ID token and never the Google password). With `VITE_USE_MOCKS=true` it is a plain demo button; with neither, nothing is drawn. `GoogleSignIn` adds the request (`POST /api/v1/auth/google`), the error message and the session start: there is no code step because Google already proved the email.

```tsx
<GoogleSignIn text="signin_with" />   // /login
<GoogleSignIn text="signup_with" />   // /register
```

### PasswordChecklist

Rules of a new password, ticked while the user types, with a bar that fills as they are met. Used under the password field of the registration form and in "Cambiar contraseña". The five main rules (10 to 64 characters, lowercase, uppercase, digit, special character) are always listed; "sin espacios", "no es una contraseña muy común" and "no incluye tu usuario ni tu correo" appear only when they are the problem. The rules live in `src/auth/passwordRules.ts` and mirror the backend's `PasswordPolicy`, which has the last word. Never says "strong": it only says which requirements are met.

```tsx
<PasswordChecklist password={form.password} username={form.username} email={form.email} />
```

### StatusBadge

Pill that shows a health status.

```tsx
<StatusBadge status="OBSERVED" />            // → [👁 En observación] yellow
<StatusBadge status="CRITICAL" size="lg" />
```

| Prop | Type | Default |
|---|---|---|
| `status` | `HealthStatus \| "UNKNOWN"` | — |
| `size` | `"sm" \| "md" \| "lg"` | `"md"` |

Icon + label always visible. Uses `--status-*-fg` / `--status-*-bg`.

### MarkColorDot

```tsx
<MarkColorDot color="RED" />                  // ● Rojo
<MarkColorDot color="WHITE" showLabel={false} /> // only in dense tables, with aria-label
```

### GuineaPigCard

The main building block of the cage view.

```
┌▌───────────────────────────────┐   ▌ = 4 px left border in --status-*-accent
│▌ ● Rojo   Bolita                │
│▌ [⚠ Alerta]                     │
│▌ Quieto 48 de los últimos 60 s  │
│▌ Visto hace 2 min            →  │
└▌───────────────────────────────┘
```

- Whole card is a link to `/guinea-pigs/:id` (min height 88 px).
- Shows at most one behavior summary line, translated to plain words.
- If last seen > 10 min → status `UNKNOWN` and text "No se ha visto hace X min".

### GuineaPigGrid

List of `GuineaPigCard`s (`<ul>`/`<li>`). 1 column on mobile, 2 from 640 px, auto-fill columns of at least 260 px from 1024 px. Cards in a row share the same height.

### CageStatusBanner

Traffic light at the top of the cage view, driven by `GET /api/cages/{id}/health`.

- Headline in `--text-display`: "Todo bien en la jaula" / "1 cuy en observación" / "2 cuyes en alerta".
- Background `--status-*-bg` of the worst status in the cage.
- Includes `LiveIndicator`.
- Below the headline: one chip per status with its guinea pig count (worst first, zeros hidden) and "Actualizado hace X".
- Status icon in a white circle and a 4 px stripe on top in `--status-*-accent`.

### LiveIndicator

Shows the WebSocket state.

| State | Look | Text |
|---|---|---|
| connected | green dot | "En vivo" |
| connecting | yellow dot | "Conectando…" |
| reconnecting | yellow dot, subtle pulse | "Reconectando…" |
| disconnected | gray dot | "Sin conexión en vivo — los datos pueden estar desactualizados" |

The state is announced with `aria-live="polite"`. The reconnect pulse is disabled when reduced motion is preferred.

### AlertList / AlertItem

- Each item: `StatusBadge` of the alert level, guinea pig name + `MarkColorDot` (or "Toda la jaula" for audio), message, relative time, "Marcar como revisada" button.
- Open alerts first, newest on top. Reviewed alerts collapsed under "Revisadas".
- Audio alerts use the icon `volume-2`.

### AlertToast

New live alert of level `ALERT` or `CRITICAL` → toast at the top (mobile) or bottom-right (desktop), stays until dismissed, with a "Ver" action. `OBSERVED` changes don't toast; they only update the card.

### Buttons

| Variant | Use |
|---|---|
| `primary` | One per screen: "Registrar cuy", "Guardar" |
| `secondary` | "Marcar como revisada", "Ver detalle" |
| `ghost` | Navigation, "Cancelar" |
| `danger` | Destructive (deactivate a guinea pig, deactivate my account) — always with confirmation |

Min height 44 px, `--radius-md`, visible focus ring.

### Form fields

- Label always visible above the field (no placeholder-only labels).
- Mark color picker: grid of `MarkColorDot` buttons; colors already used in the cage are disabled with the text "En uso".
- Errors in `--status-critical-fg` below the field, with an icon.

### AuthLayout

Shell for `/login`, `/register` and `/verify`.

```
┌──────────────────────────────┐
│        [logo] Cuy Monitor    │   app name in --text-h1, small logo (no status colors)
│   Cuida a tus cuyes a tiempo │   --text-body, --color-text-muted
│ ┌──────────────────────────┐ │
│ │  form card (--surface)   │ │   --radius-lg, --shadow-card, padding --space-5
│ └──────────────────────────┘ │
│  ¿No tienes cuenta? Regístrate│  secondary link below the card
└──────────────────────────────┘
```

- Background `--color-bg`; the card is the only surface. One `primary` button per screen.
- Shows `SessionNotice` above the card when the user arrives after a logout or an expired session.

### TextField / PasswordField

- Built on the rules of "Form fields" below. Height 48 px, `--text-body` (16 px, so iOS doesn't zoom).
- `PasswordField` adds a ghost icon button "Mostrar / Ocultar" (eye / eye-off) with `aria-pressed`; never shows the password by default.
- On `/register`, the password rule is visible under the field before typing ("Entre 8 y 72 caracteres") and turns into an error only after blur or submit.
- Proper `autocomplete`: `username`, `name`, `email`, `current-password`, `new-password`.

### OtpInput

Six boxes for the verification code.

```
Te enviamos un código a j•••@gmail.com
┌──┐┌──┐┌──┐ ┌──┐┌──┐┌──┐
│ 4││ 8││ 1│ │  ││  ││  │         each box 48 × 56 px, --text-h1, tabular-nums
└──┘└──┘└──┘ └──┘└──┘└──┘
Vence en 4:32 · Reenviar código     countdown in --text-small; resend enabled after 30 s
```

| Prop | Type | Default |
|---|---|---|
| `length` | `number` | `6` |
| `value` / `onChange` | `string` | — |
| `onComplete` | `(code: string) => void` | submits automatically when all boxes are filled |
| `error` | `string \| undefined` | — |

- One logical `<input inputMode="numeric" autocomplete="one-time-code">` (so phones offer the code from the email/SMS) rendered as boxes; paste of the full code works.
- Focus moves to the next box on type and back on Backspace.
- Error state: boxes get a `--status-critical-fg` border + message below; the value is cleared.
- When the code expires: message "El código venció" + primary "Enviar un código nuevo".

### UserMenu

- Top bar (tablet+): avatar circle with the user's initials (`--color-primary` on `--color-surface`, not a status color) → menu with full name, "Mi cuenta" and "Cerrar sesión".
- Mobile: same options live in the "Cuenta" tab (`/account`); "Cerrar sesión" is a `secondary` button at the bottom of that page.
- Logout needs no confirmation (it's harmless and quick to undo).

### SessionNotice

Neutral banner (`--color-surface`, `--color-border`, info icon) on `/login`:

| Reason | Text |
|---|---|
| `expired` | "Tu sesión terminó. Vuelve a entrar para seguir viendo tus cuyes." |
| `logout` | "Cerraste sesión." |
| `disabled` | "Tu cuenta fue desactivada." |

### EmptyState / ErrorState / Loading

- `EmptyState`: icon + one sentence + action ("Aún no hay cuyes registrados" → "Registrar cuy").
- `ErrorState`: what failed + retry button. Never a raw error message.
- Loading: skeleton cards with the same size as `GuineaPigCard` (no spinners over empty screens).

---

## 4. Charts (Recharts)

| Chart | Type | Rules |
|---|---|---|
| `BehaviorChart` | Line (still seconds per 60 s window) + bar (feeder/waterer visits) | Main series in `--color-primary`; the guinea pig's normal range as a light band in `--color-border`; background bands with `--status-*-accent` at 12% opacity where the state was `OBSERVED`/`ALERT`/`CRITICAL` |
| `WeightChart` | Line (grams over time) | Only `stable: true` readings; y-axis starts at a sensible minimum, not at 0 |
| State timeline | Horizontal segmented bar | One segment per state period, colored with `--status-*-accent`, labeled on hover/tap |

- Axes and legends use `--text-caption` and `--color-text-muted`.
- Dates in Spanish (`es-CO` locale): "25 sep, 14:30".
- Every chart has a one-line text summary above it ("Esta semana estuvo quieto más de lo normal") and an accessible description.
- Range selector: "Hoy", "7 días", "30 días".

---

## 5. Content and voice

- Spanish, short sentences, no jargon. Address the farmer with neutral forms ("Revisar alerta", "Registrar cuy").
- Buttons are verbs: "Registrar", "Marcar como revisada", "Ver detalle".
- Account words: "Iniciar sesión", "Crear cuenta", "Cerrar sesión", "Código de verificación", "Mi cuenta". Never "login", "token", "OTP", "JWT".
- Auth messages:

| Situation | On screen |
|---|---|
| Wrong username or password (or disabled account) | "Usuario o contraseña incorrectos." |
| Wrong code | "El código no es correcto. Revisa el correo e inténtalo otra vez." |
| Code expired / too many attempts | "El código venció. Te enviamos uno nuevo." (after resend) |
| Username or email already used | "Ese usuario o correo ya está registrado." |
| Weak password | "La contraseña debe tener entre 8 y 72 caracteres." |
| Code sent | "Te enviamos un código a j•••@gmail.com. Puede tardar un minuto; revisa también el correo no deseado." |
| Deactivate account (confirmation) | "¿Desactivar tu cuenta? Ya no podrás entrar. Escribe tu contraseña para confirmar." |

- Translate model outputs into behavior:

| Data | On screen |
|---|---|
| `stillSeconds: 48` of 60 | "Quieto 48 de los últimos 60 s" |
| `feederVisits: 0` over the last hour | "No ha ido al comedero en la última hora" |
| `probAnomaly: 0.81` | not shown as a number; the status badge already expresses it |
| `AUDIO DISTRESS` | "Se escucharon chillidos de angustia en la jaula" |

- Relative times: "hace 2 min", "hace 1 h", then absolute date after 24 h.
- Never hardcode strings in JSX. Keys in English, grouped by screen: `cage.headline.allGood`, `guineaPig.lastSeen`, `alerts.markReviewed`, `status.OBSERVED`, `markColor.RED`, `auth.login.title`, `auth.verify.resend`, `auth.error.invalidCredentials`, `account.logout`.

---

## 6. Accessibility checklist

- [ ] Text contrast ≥ 4.5:1; UI marks ≥ 3:1.
- [ ] Status and mark color never conveyed by color alone.
- [ ] Tap targets ≥ 44 × 44 px.
- [ ] Visible focus ring on every interactive element; logical tab order.
- [ ] Live updates announced with `aria-live="polite"` (`assertive` only for `CRITICAL`).
- [ ] Charts have a text alternative.
- [ ] Works at 200% zoom and 360 px width without horizontal scroll.
- [ ] `lang="es"` on `<html>`.
- [ ] Every form field has a visible `<label>`; errors linked with `aria-describedby` and announced (`aria-live="polite"`).
- [ ] `OtpInput` is one input for screen readers ("Código de verificación, 6 dígitos"), not six unlabeled boxes.
- [ ] Password managers and phone code autofill work (`autocomplete` attributes).
- [ ] After login, focus goes to the page title; after logout, to the `SessionNotice`.

---

## 7. File layout

```
src/styles/
├── tokens.css        ← all custom properties (light + dark)
├── reset.css
└── global.css        ← body, typography defaults
src/components/<Name>/<Name>.tsx + <Name>.module.css
src/i18n/locales/es.json
```
