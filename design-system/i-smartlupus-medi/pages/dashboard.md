# Page Override: Dashboard

> Inherits from `MASTER.md`. Only deviations and composition below.

**Pattern:** Bento Grid — Apple Health / Fitness Summary aesthetic.
**Role-aware:** Layout adapts per role (pemohon / penyemak / pelulus / pentadbir).

## Layout

- `max-w-5xl mx-auto px-4 py-6 pb-24` (pb-24 reserves space for bottom nav).
- Grid: `grid grid-cols-2 gap-3` mobile → `grid-cols-4 gap-4` tablet+.
- Bento is the **only** place Bento style is allowed in the app.

## Composition (top → bottom)

1. **Greeting strip** — `title-1` ("Selamat pagi, {nama}") + `subhead` muted (date + role chip). Not a card, flush against grid.
2. **Stat Bento** — 4 cards: Total Permohonan, Menunggu Semakan, Dalam Pelaksanaan, Selesai Bulan Ini.
   - Each: icon top-left (Lucide, 20px, tinted by state), number `title-1` tabular, label `footnote` muted.
   - Mobile 2×2, tablet 1×4.
3. **StatusChart** — spans `col-span-2` both breakpoints. Recharts donut or stacked bar. Legend right-side tablet, below mobile.
4. **Recent tickets** — last 5, flat list items (not bento). Header `title-3` + "Lihat semua →" right link.
5. **Primary action (pemohon only)** — Fixed floating `btn-primary` bottom-right above bottom nav: "+ Mohon Baru". Hidden for other roles.

## Interaction

- Tap a stat card → filtered ticket list for that state.
- Tap recent ticket → ticket detail.
- Refresh: pull-to-refresh on mobile (native PWA). Skeleton shimmer during load (not spinner).

## Specific overrides

- Bento cards use `shadow-sm` + `border`. Hover lift `-1px`, shadow to `shadow-md`.
- Numbers are tabular-nums so they don't jitter during refresh.
- Loading: skeleton blocks at each bento slot, never a blank layout or spinner cover.
- Empty state (no tickets ever created): warm illustration + "Mohon pelupusan pertama anda" CTA. Not a blank grid.

## Role variants

| Role | Visible stats | Primary action |
|------|---------------|----------------|
| pemohon | Saya: Draf, Dihantar, Selesai | + Mohon Baru (floating) |
| penyemak | Semua: Menunggu Semakan, Disemak Hari Ini | Tap to semakan list |
| pelulus | Semua: Menunggu Lulusan, Diluluskan, Ditolak | Tap to lulusan list |
| pentadbir | Semua: 4 tahap + Jumlah Pengguna | No floating CTA, full stats |

## Dark mode

- Bento cards `bg-slate-900 border-slate-800`, shadow removed (rely on border).
- Chart colors use dark-tuned palette (blue-400, emerald-400, amber-400, indigo-400, red-400).
