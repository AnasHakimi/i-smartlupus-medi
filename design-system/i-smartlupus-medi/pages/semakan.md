# Page Override: Semakan (Review Queue)

> Inherits from `MASTER.md`. Only deviations and composition below.

**Pattern:** iOS Inbox / Reminders list + swipe actions.
**Role:** penyemak + pelulus (filtered view per role).

## Layout

- `max-w-3xl mx-auto px-0 py-0 pb-24` (flush-to-edge list).
- Sticky top: search + filter bar (`sticky top-0 z-10 bg-slate-50 border-b`).
- List fills remaining height.

## Composition

1. **Top bar** — "Semakan" `title-1`, count chip ("24 menunggu") right.
2. **Filter bar** — horizontal scroll chips: Semua · Menunggu Semakan · Menunggu Lulusan · Ditolak. Active state: `primary` fill, `on-primary` text.
3. **Search** — Lucide `Search` icon + 48px input, placeholder "Cari No. Siri / Nama Aset". Clear button when typed.
4. **List** — flat list items, divided by `border-b border-slate-200`.
   - Each row: avatar/icon (jenis aset) | 2 lines (nama aset + pemohon name) | state chip right | chevron.
   - 72px min height per row (iOS mail inbox height).
5. **Empty state** — if filter returns 0: icon + `body` muted "Tiada permohonan menunggu". Not a chart, not a card.

## Interaction

- **Swipe left** on row: "Tolak" (red) · "Lulus" (emerald). Swipe affordance: first open partially reveals chevron hint.
- **Long-press** on row: bulk-select mode with checkboxes left, action bar bottom.
- Tap row → ticket detail with full form + action buttons.
- Pull-to-refresh.

## Specific overrides

- No card wrappers on list items. Flat dividers, iOS Settings style.
- State chip right-aligned, uses `radius-sm` stamps per MASTER.
- Row active state: `bg-slate-100` on press (200ms).
- Destructive swipe (red) requires confirm modal before commit.

## Action sheet (from detail)

- Bottom sheet (iOS-style), rounded-t-2xl, slides up `spring-gentle` 300ms.
- 3 buttons stacked: Lulus (primary) · Tolak (destructive) · Batal (ghost).
- Reject requires `rejection_reason` textarea (PRD gap). Min 10 chars. Error if empty.

## Dark mode

- List items `bg-slate-900`, divider `border-slate-800`.
- Active press state: `bg-slate-800`.
- Swipe action backgrounds: red-500 / emerald-500 (dim versions in dark).
