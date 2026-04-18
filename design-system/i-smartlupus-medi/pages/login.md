# Page Override: Login

> Inherits from `MASTER.md`. Only deviations and composition below.

**Pattern:** Minimal Single Column — single CTA focus, hero typography.
**Inspiration:** Apple ID sign-in + iOS Setup Assistant — calm, centered, one job.

## Layout

- Full-height centered column, max-width 400px.
- Safe-area padding top + bottom. `min-h-dvh` (not `100vh` — mobile).
- Surface: pure white on `slate-50` background. No card wrapper — the form IS the page.

## Composition (top → bottom)

1. **Brand mark** — 64px SVG lockup + "i-SMARTLUPUS MEDI" in `title-2`. 32px margin below.
2. **Greeting** — `display` ("Selamat datang") + `body` muted ("Log masuk dengan No. Kad Pengenalan"). 24px gap.
3. **Form**
   - IC input — 12-digit numeric, formatted `XXXXXX-XX-XXXX` with auto-hyphen, `inputMode="numeric"`, `autocomplete="username"`, `maxLength=14`.
   - Password input — show/hide toggle (Lucide `Eye` / `EyeOff`), `autocomplete="current-password"`.
   - Both fields 48px height, 16px body text, `radius-md`.
   - 16px gap between fields.
4. **Primary CTA** — "Log Masuk" full-width, 48px, `btn-primary`. 24px above.
5. **Helper** — `footnote` muted: "Masalah log masuk? Hubungi Unit Aset" + tel: link. Center-aligned, 32px below CTA.

## Interaction

- Inline validation on blur only (never on keystroke).
- Error placement: `aria-live="polite"` region directly below the invalid field, `destructive` color, `footnote` size.
- On submit: disable CTA, replace label with spinner + "Log masuk...". Keep 48px height to prevent shift.
- On success: 200ms fade, route to `/dashboard`.

## Specific overrides

- No bottom nav on this page (guest state).
- Hero typography allowed (`display` token) — only page where it's used.
- Brand mark is the only decorative element. No background gradients, no illustrations.

## Dark mode

- Background `slate-950`, form surface stays `slate-950` (no card elevation — form IS the page).
- Inputs get `border-slate-800` + `bg-slate-900` for fillable affordance.
