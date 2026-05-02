# Page Override: Status (Ticket Detail + Timeline)

> Inherits from `MASTER.md`. Only deviations and composition below.

**Pattern:** iOS Tracking timeline + grouped detail.
**Inspiration:** Apple order-tracking + Reminders detail sheet.

## Layout

- `max-w-2xl mx-auto px-4 py-4 pb-24`.
- Timeline first (above the fold), details below.

## Composition

1. **Top bar** — back chevron, "Butiran Permohonan" `title-3`, overflow menu right (edit / cancel / print).
2. **Hero block** — `title-1` asset name + No. Siri in `callout` muted tabular. State chip large-size below (`radius-sm`, 32px height for hero context).
3. **Timeline** — 4 stages as vertical rail:
   ```
   ● Permohonan      (2026-04-12 10:30)   — Ali Bin Ahmad
   │
   ● Semakan         (2026-04-13 09:15)   — Puan Aminah
   │
   ○ Pelaksanaan     (pending)
   │
   ○ Selesai         (—)
   ```
   - Filled dot `primary`, rail line `slate-300`, upcoming stages dot `slate-300` outlined.
   - Rejected: final stage becomes `destructive` with `rejection_reason` body beneath.
4. **Maklumat Aset** section (grouped list) — all PRD fields read-only.
5. **Lampiran** — photo thumbnails 80×80px grid, tap for lightbox.
6. **Officer trail** (PRD gap) — who completed each stage, with `completed_by` + timestamp.
7. **Action bar** (if role + state allow):
   - pemohon + draf: Edit · Padam.
   - penyemak + menunggu: Lulus · Tolak.
   - pelulus + menunggu lulusan: Lulus · Tolak.
   - pentadbir: Arkib · Tutup.

## Interaction

- Photo tap → full-screen lightbox with swipe between photos (iOS Photos pattern), pinch-zoom.
- Timeline is not interactive (read-only display).
- Edit/delete destructive actions require confirm modal per MASTER.

## Specific overrides

- Timeline colors follow state chip palette per MASTER.
- Dates always absolute + relative: `2026-04-12 10:30 · 6 hari lepas`.
- If `rejection_reason` exists, it appears as a red-tinted `alert` block (bg `red-50`, text `red-900`, border `red-200`) below the rejected stage.

## Dark mode

- Timeline rail `slate-700`, filled dots `blue-400`, upcoming `slate-600`.
- Photo thumbnails `border-slate-800`.
