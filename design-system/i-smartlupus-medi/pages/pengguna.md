# Page Override: Pengguna (User Management — Pentadbir only)

> Inherits from `MASTER.md`. Only deviations and composition below.

**Pattern:** List + detail sheet, iOS Contacts-style.
**Access:** pentadbir only. Redirect other roles to dashboard.

## Layout

- `max-w-4xl mx-auto px-4 py-4 pb-24`.
- Top bar with count + add button.

## Composition

1. **Top bar** — "Pengguna" `title-1`, user count `subhead` muted below ("24 pengguna aktif").
2. **Add button** — `btn-primary` "+ Pengguna Baru" top-right, 40px height (secondary action size).
3. **Role filter chips** — Semua · Pemohon · Penyemak · Pelulus · Pentadbir.
4. **Search** — full-width, matches semua pattern.
5. **List** — flat rows:
   - Avatar circle (initials, colored by role) | nama + IC (tabular) | role chip right | chevron.
   - Tap row → edit sheet.
6. **Empty state** — "Tiada pengguna ditemui" + "Kosongkan filter" link.

## Edit sheet (bottom-sheet modal)

Slides up, `rounded-t-2xl`, `spring-gentle` 300ms. Contents:

1. Nama Penuh (text)
2. No. IC (text, 12 digit, tabular, autoformat `XXXXXX-XX-XXXX`)
3. Emel (text, `inputMode="email"`)
4. No. Telefon (text, `inputMode="tel"`)
5. Jawatan / Unit (text)
6. Peranan (segmented control — 4 options visual; use iOS-style pill segmented control here EXCEPTION to radius rule since it's a control not a state chip)
7. Status (toggle — Aktif / Tidak Aktif)
8. **Padam akaun** — destructive button bottom, requires typed confirmation ("Padam {nama}" input match).

## Interaction

- Edit/save: optimistic UI with rollback on server error + toast error.
- Delete: **undo toast** for 5s after action (Apple HIG `undo-support`).
- Add new: opens same sheet with empty state, title "Pengguna Baru".
- Role change: confirm modal if demoting an active approver.

## Specific overrides

- Segmented control for peranan is the **only** rounded-full UI element in the app. Justified because it's an iOS native control pattern, not a state signifier.
- IC field masks input on type, server stores unformatted.
- Password field hidden from edit sheet; use separate "Reset Password" link that triggers Supabase flow.

## Dark mode

- Avatar colored by role (blue/emerald/amber/indigo) — use dark-tuned `400` variants.
- Segmented control: `bg-slate-800`, selected segment `bg-slate-700 text-white`.
