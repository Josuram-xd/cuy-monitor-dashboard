# Design System — cuy-monitor-dashboard

> Visual language, UI components and design rules for the farmer-facing dashboard.
> Stack: React 19 · TypeScript 6 · Vite 8 · CSS Modules + CSS custom properties · Recharts 3 · i18next
> Last reviewed: 2026-09-26

---

## 1. Principles

1. **Status first.** The first thing a farmer sees is whether any guinea pig needs attention. Everything else is secondary.
2. **Never color alone.** Every health status is shown with color **+ icon + text**. Mark colors are always shown with their name.
3. **Plain Spanish.** No technical words on screen (no "probAnomaly", "event", "API"). All text lives in `src/i18n/locales/es.json`.
4. **Honest about uncertainty.** If there is no data or the live connection is down, say so. Unknown is never displayed as "Normal".
5. **Mobile-first, outdoor-friendly.** Designed for a 360 px phone in daylight: high contrast, large tap targets, few elements per screen.
6. **Calm by default.** Strong colors are reserved for `ALERT` and `CRITICAL`. A healthy cage looks quiet.

---

## 2. Design tokens

All tokens are CSS custom properties in `src/styles/tokens.css`. Components never use raw hex values.

### 2.1 Color — brand and neutrals

| Token | Light | Dark | Use |
|---|---|---|---|
| `--color-primary` | `#2F5D8A` | `#7FB0E0` | Primary buttons, links, main chart series |
| `--color-primary-hover` | `#244A6F` | `#A3C8EC` | Hover/pressed |
| `--color-bg` | `#F6F7F9` | `#121417` | Page background |
| `--color-surface` | `#FFFFFF` | `#1C1F24` | Cards, panels |
| `--color-border` | `#E3E6EA` | `#2E333A` | Card borders, dividers |
| `--color-text` | `#1C1F23` | `#ECEFF3` | Main text |
| `--color-text-muted` | `#6B7380` | `#9AA3AF` | Secondary text, timestamps |
| `--color-focus` | `#2F5D8A` | `#7FB0E0` | Focus ring (2 px + 2 px offset) |

The primary is blue on purpose: green, yellow, orange and red are reserved for health status.

### 2.2 Color — health status

| Status | Spanish label (es.json) | Icon | `--status-*-fg` | `--status-*-bg` | `--status-*-accent` |
|---|---|---|---|---|---|
| `NORMAL` | Normal | check-circle | `#1F7A3D` | `#E6F4EA` | `#2E9E55` |
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
| `--shadow-card` | `0 1px 2px rgb(0 0 0 / 0.06), 0 1px 3px rgb(0 0 0 / 0.08)` |
| `--shadow-overlay` | `0 8px 24px rgb(0 0 0 / 0.16)` (toasts, dialogs) |

### 2.6 Layout and breakpoints

| Name | Min width | Guinea pig grid |
|---|---|---|
| mobile (default) | 0 | 1 column |
| `--bp-tablet` | 640 px | 2 columns |
| `--bp-desktop` | 1024 px | 3–4 columns, alerts panel on the right |

- Page padding: 16 px on mobile, 24 px from tablet.
- Max content width: 1200 px.
- Bottom navigation bar on mobile (Jaula · Alertas · Registrar); top bar from tablet.

### 2.7 Motion

- Default transition: 150 ms `ease-out` (hover, focus, badge color change).
- A guinea pig whose status just went up gets a single 600 ms highlight pulse on its card. No looping animations.
- Respect `prefers-reduced-motion: reduce` (disable the pulse).

### 2.8 Dark mode

Supported through `prefers-color-scheme` by redefining the tokens in section 2.1. Status `fg`/`bg` pairs have dark variants defined in `tokens.css` with the same contrast rule. Light mode is the default and the one tested in daylight.

---

## 3. Components

All components live in `src/components/`, one folder per component with `Component.tsx` + `Component.module.css`. Props in English, visible text via `t()`.

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

### CageStatusBanner

Traffic light at the top of the cage view, driven by `GET /api/cages/{id}/health`.

- Headline in `--text-display`: "Todo bien en la jaula" / "1 cuy en observación" / "2 cuyes en alerta".
- Background `--status-*-bg` of the worst status in the cage.
- Includes `LiveIndicator`.

### LiveIndicator

Shows the WebSocket state.

| State | Look | Text |
|---|---|---|
| connected | green dot | "En vivo" |
| reconnecting | yellow dot, subtle pulse | "Reconectando…" |
| disconnected | gray dot | "Sin conexión en vivo — los datos pueden estar desactualizados" |

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
| `danger` | Destructive (deactivate a guinea pig) — always with confirmation |

Min height 44 px, `--radius-md`, visible focus ring.

### Form fields

- Label always visible above the field (no placeholder-only labels).
- Mark color picker: grid of `MarkColorDot` buttons; colors already used in the cage are disabled with the text "En uso".
- Errors in `--status-critical-fg` below the field, with an icon.

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
- Translate model outputs into behavior:

| Data | On screen |
|---|---|
| `stillSeconds: 48` of 60 | "Quieto 48 de los últimos 60 s" |
| `feederVisits: 0` over the last hour | "No ha ido al comedero en la última hora" |
| `probAnomaly: 0.81` | not shown as a number; the status badge already expresses it |
| `AUDIO DISTRESS` | "Se escucharon chillidos de angustia en la jaula" |

- Relative times: "hace 2 min", "hace 1 h", then absolute date after 24 h.
- Never hardcode strings in JSX. Keys in English, grouped by screen: `cage.headline.allGood`, `guineaPig.lastSeen`, `alerts.markReviewed`, `status.OBSERVED`, `markColor.RED`.

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
