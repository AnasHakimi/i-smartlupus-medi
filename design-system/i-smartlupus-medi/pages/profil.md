# Page Override: Profil (My Profile)

> Inherits from `MASTER.md`. Only deviations and composition below.

**Pattern:** iOS Settings root — grouped list, heavy whitespace.
**Inspiration:** iPhone Settings > Apple ID.

## Layout

- `max-w-md mx-auto px-4 py-6 pb-24`.
- Hero + 2 grouped sections.

## Composition

1. **Hero** — avatar 80px circle (initials or photo), centered. Nama `title-1` below centered. Role `callout` muted below that. 32px gap below hero.
2. **Section 1 — Maklumat** (read-only grouped list)
   - No. IC (tabular, masked: `XXXXXX-**-****`, tap to reveal)
   - Emel
   - No. Telefon
   - Jawatan / Unit
3. **Section 2 — Tetapan** (actions)
   - Tukar Kata Laluan → chevron
   - Tema: Sistem · Terang · Gelap (segmented control)
   - Bahasa: Bahasa Melayu (read-only for now, future)
4. **Log Keluar** — `btn-destructive` ghost variant (red text, no fill), full-width, bottom of list with 32px separation.

## Interaction

- Avatar tap: no-op in v1 (photo upload deferred).
- Tukar kata laluan: opens sheet with current + new + confirm fields, 48px each. Strength meter below new password.
- Theme toggle: immediate apply + persist to localStorage + respect system initial.
- Log keluar: confirm modal "Log keluar dari akaun?" before Supabase signOut.

## Specific overrides

- This is the other rounded-full exception: avatar only. Never use `rounded-full` elsewhere.
- No card wrappers — use grouped list dividers (iOS Settings pattern).
- Log keluar is the destructive zone — spatially separated by 32px min.
- Theme toggle is the only settings control visible currently. Hide placeholders; don't show disabled "Coming soon" items (empty-nav anti-pattern).

## Dark mode

- Avatar initials use role color at `400` variant on `slate-800` circle.
- Grouped list dividers `border-slate-800`.
- Log keluar button text stays red-400 (not red-600) for dark contrast.
