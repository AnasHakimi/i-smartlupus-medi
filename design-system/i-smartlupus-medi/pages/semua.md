# Page Override: Semua (All Tickets)

> Inherits from `MASTER.md`. Only deviations and composition below.

**Pattern:** Master list with filters + detail drill.
**Inspiration:** Apple Mail All Inboxes — dense, scannable, filterable.

## Layout

Same list shell as `semakan.md` — flush list, sticky filter bar. Differences below.

## Composition

1. **Top bar** — "Semua Permohonan" `title-1`, export icon right (pentadbir only, Lucide `Download`).
2. **Filter chips** — scroll row: Semua · Saya (pemohon only) · Permohonan · Semakan · Pelaksanaan · Selesai · Tolak.
3. **Sort dropdown** — inline right of filter bar: "Terbaru" / "Tertua" / "Mengikut No. Siri". Lucide `ArrowDownUp` icon.
4. **Search** — same as semakan.
5. **Grouped list** — tickets grouped by status with sticky sub-headers (`subhead` muted, uppercase, tracking 0.05em, sticky top-12 after filter bar).
6. **Virtualized** — if list > 50 items, use `react-window` or similar. Target 60fps scroll.

## Interaction

- Tap row → ticket detail (read-only for pemohon, editable per role).
- Long-press (pentadbir only) → bulk export / archive.
- Pull-to-refresh.
- Deep link: `/semua?status=selesai` preserves filter on route.

## Specific overrides

- Tabular nums for No. Siri column — prevents jitter during sort.
- Row shows state chip + relative time ("2j lepas", "3h lepas") in `caption` muted right-aligned.
- No bento cards on this page ever.

## Empty + error states

- **Empty (no data ever):** Illustration + body muted + "+ Mohon Baru" (pemohon only).
- **Empty (filter result 0):** icon + "Tiada padanan" + "Kosongkan filter" ghost link.
- **Error:** `role="alert"` banner top of list + "Cuba lagi" ghost button.

## Dark mode

- Sticky sub-headers `bg-slate-950/80 backdrop-blur-sm` (only backdrop-blur allowed — iOS nav bar pattern).
- Divider `border-slate-800`.
