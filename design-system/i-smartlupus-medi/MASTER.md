# Design System Master File

> **LOGIC:** When building a specific page, first check `design-system/i-smartlupus-medi/pages/[page-name].md`.
> If that file exists, its rules **override** this Master file.
> If not, strictly follow the rules below.

---

**Project:** i-SMARTLUPUS MEDI
**Generated:** 2026-04-18 (corrected from auto-gen — auto-gen picked Neumorphism which conflicts with stated iOS + institutional hybrid direction)
**Category:** Healthcare PWA · Malaysian government hospital context
**Direction:** iOS classic (Apple Reminders + Apple Health) with institutional geometry preserved

---

## Design Direction

**Blend:** Apple Reminders / Apple Settings language for forms and lists (flat, zero shadow, solid primary buttons, crisp dividers). Apple Health language for the dashboard (Bento grid, rounded cards, subtle elevation).

**Institutional overrides:** Preserve hospital-context trust cues — stamps (rounded-md) on state chips, never rounded-full pills. Bahasa Melayu UI throughout.

**Density override (2026-04-18):** Default button size is 36px (dense) per user preference. The 2026-04-12 audit's 48px floor is overridden for buttons. 48px is reserved for full-width sticky form submits (login/form bottom bar). 8px+ gap between adjacent buttons keeps the effective hit area accessible.

**Dark mode:** Full parity. Not inverted — a separate tuned palette.

---

## Color Tokens

### Light mode

| Role | Hex | Tailwind | Usage |
|------|-----|----------|-------|
| Primary | `#2563EB` | `blue-600` | Primary buttons, active nav, focus ring |
| Primary hover | `#1D4ED8` | `blue-700` | Hover state only |
| On Primary | `#FFFFFF` | `white` | Text on primary |
| Accent | `#059669` | `emerald-600` | Approve / success / "Lulus" |
| On Accent | `#FFFFFF` | `white` | Text on accent |
| Destructive | `#DC2626` | `red-600` | Delete, reject, "Tolak" |
| Warning | `#D97706` | `amber-600` | Pending review stamps |
| Background | `#F8FAFC` | `slate-50` | Page background |
| Surface | `#FFFFFF` | `white` | Cards, sheets, modals |
| Foreground | `#0F172A` | `slate-900` | Primary text |
| Muted Foreground | `#64748B` | `slate-500` | Secondary text, labels |
| Muted | `#F1F5F9` | `slate-100` | Subtle fills, skeleton |
| Border | `#E2E8F0` | `slate-200` | Card borders, dividers |
| Ring | `#2563EB` | `blue-600` | Focus outline |

### Dark mode

| Role | Hex | Tailwind | Notes |
|------|-----|----------|-------|
| Primary | `#60A5FA` | `blue-400` | Elevated, not blue-600 (too low contrast on dark) |
| On Primary | `#0F172A` | `slate-900` | Dark text on light primary |
| Accent | `#34D399` | `emerald-400` | Elevated green |
| Destructive | `#F87171` | `red-400` | Elevated red |
| Background | `#020617` | `slate-950` | Page background |
| Surface | `#0F172A` | `slate-900` | Cards, sheets |
| Surface Elevated | `#1E293B` | `slate-800` | Modals, dropdown menus |
| Foreground | `#F1F5F9` | `slate-100` | Primary text |
| Muted Foreground | `#94A3B8` | `slate-400` | Secondary text |
| Border | `#1E293B` | `slate-800` | Card borders |
| Ring | `#60A5FA` | `blue-400` | Focus outline |

**Rule:** Use semantic CSS vars (`--bg`, `--fg`, `--primary`) mapped per theme. Never hardcode hex in components.

---

## Typography

- **Family:** Inter (web), falls back to `-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI"`, then Roboto
- **Why Inter:** Native SF Pro fallback on iOS devices = true iOS feel. Covers Bahasa Melayu (Latin extended). Free, variable, loads fast.
- **Load:** Self-host via `next/font/google` — no FOIT.

### Type scale (Dynamic Type-inspired)

| Token | Size / Line-height / Weight | Usage |
|-------|---------|-------|
| `display` | 32px / 40px / 700 tracking `-0.025em` | Hero only (login) |
| `title-1` | 24px / 32px / 700 tracking `-0.02em` | Page titles |
| `title-2` | 20px / 28px / 600 | Section headers |
| `title-3` | 17px / 24px / 600 | Card titles |
| `body` | 16px / 24px / 400 | Primary body text (min mobile) |
| `callout` | 15px / 22px / 500 | Emphasized body |
| `subhead` | 14px / 20px / 500 | Form labels |
| `footnote` | 13px / 18px / 400 | Helper text, metadata |
| `caption` | 12px / 16px / 500 | Stamps, badges (min allowed) |

**Rules:**
- Body minimum 16px on mobile (prevents iOS auto-zoom on input focus).
- Never below 12px anywhere. Floor set by 2026-04-12 polish audit.
- Use tabular numbers for any IC numbers, dates, ticket IDs: `font-variant-numeric: tabular-nums`.

### Tailwind config

```js
fontFamily: {
  sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'SF Pro Text', 'Segoe UI', 'Roboto', 'sans-serif'],
}
```

---

## Spacing

8pt base grid.

| Token | Value | Usage |
|-------|-------|-------|
| `space-1` | 4px | Icon–label gap |
| `space-2` | 8px | Tight inline gap |
| `space-3` | 12px | Button vertical padding |
| `space-4` | 16px | Default padding, list item gap |
| `space-5` | 20px | Card inner padding |
| `space-6` | 24px | Section padding |
| `space-8` | 32px | Section gap |
| `space-12` | 48px | Major block separation |

**Mobile inset:** `px-4` default, `px-6` on tablet+.

---

## Radius

| Token | Value | Usage |
|-------|-------|-------|
| `radius-sm` | 6px | Stamps, input fields, small buttons |
| `radius-md` | 8px | Standard buttons, list items |
| `radius-lg` | 12px | Alert banners, inline panels |
| `radius-xl` | 16px | Bento cards (dashboard) |
| `radius-2xl` | 20px | Modals, sheets |
| `radius-full` | 9999px | Avatars only — **never** on buttons or state chips |

**Institutional rule:** State chips (Permohonan/Semakan/Pelaksanaan/Selesai) always `radius-sm`. Stamps, not pills. Enforced since 2026-04-12 audit.

---

## Shadow / Elevation

| Token | Value | Usage |
|-------|-------|-------|
| `shadow-none` | `none` | Buttons, inputs, flat list items |
| `shadow-sm` | `0 1px 2px rgba(15, 23, 42, 0.04)` | Dashboard cards (Bento) |
| `shadow-md` | `0 4px 6px rgba(15, 23, 42, 0.05), 0 2px 4px rgba(15, 23, 42, 0.04)` | Floating action, bottom nav |
| `shadow-lg` | `0 10px 15px rgba(15, 23, 42, 0.08), 0 4px 6px rgba(15, 23, 42, 0.04)` | Modals |
| `shadow-ring` | `0 0 0 4px rgba(37, 99, 235, 0.12)` | Focus ring |

**Dark mode:** Drop shadow opacity, use border glow instead (`border border-slate-800`).

---

## Motion

| Token | Value | Usage |
|-------|-------|-------|
| `duration-fast` | 140ms | Exit / dismiss |
| `duration-base` | 200ms | Enter, press, color change |
| `duration-slow` | 300ms | Modal / sheet open |
| `ease-out` | `cubic-bezier(0.16, 1, 0.3, 1)` | Enter animations |
| `ease-in` | `cubic-bezier(0.7, 0, 0.84, 0)` | Exit animations |
| `spring-gentle` | `cubic-bezier(0.32, 0.72, 0, 1)` | Modal / sheet (iOS spring feel) |

**Rules:**
- Press feedback: scale to 0.97, 140ms, restores on release.
- Exit always shorter than enter (Apple HIG).
- Respect `prefers-reduced-motion` — disable non-essential transitions.
- Never animate `width` / `height` / `top` / `left`. Use `transform` / `opacity`.

---

## Component Specs

### Buttons

Three sizes. **Default (`md`) is dense 36px** — per user design preference, applies to virtually every button in the app.

| Size | Height | Font | Use for |
|------|--------|------|---------|
| `md` (default) | 36px (`h-9`) | 14px (`text-subhead`) | Everywhere by default — inline, forms, lists, modal actions |
| `lg` | 48px (`min-h-touch`) | 16px (`text-body`) | Full-width sticky submit only — login `Hantar`, form bottom-bar CTA |
| `sm` | 32px (`h-8`) | 13px (`text-footnote`) | Ultra-dense table rows, overflow menus |

```css
/* Primary md (default) — solid blue, flat, no shadow */
.btn-primary {
  background: var(--primary);
  color: var(--on-primary);
  height: 36px;
  padding: 0 14px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 14px;
  letter-spacing: 0.01em;
  transition: background 200ms ease-out, transform 140ms ease-out;
}
.btn-primary:hover { background: var(--primary-hover); }
.btn-primary:active { transform: scale(0.97); }
.btn-primary:focus-visible { outline: none; box-shadow: var(--shadow-ring); }
.btn-primary:disabled { opacity: 0.4; cursor: not-allowed; }

/* Secondary — tinted, flat, font-weight 500 */
.btn-secondary {
  background: rgba(37, 99, 235, 0.08);
  color: var(--primary);
  font-weight: 500;
}

/* Destructive — red solid */
.btn-destructive {
  background: var(--destructive);
  color: white;
  font-weight: 600;
}

/* Ghost — transparent, font-weight 500 */
.btn-ghost {
  background: transparent;
  color: var(--primary);
  font-weight: 500;
}
```

**Rules:**
- No gradients. No icon-only buttons without `aria-label`.
- Maintain 8px+ spacing between adjacent buttons so the 36px default still gets effective 44px hit area.
- Icon inside 36px button: 14px (`h-3.5 w-3.5`).

### Cards (Bento — dashboard only)

```css
.card-bento {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 20px;
  box-shadow: var(--shadow-sm);
  transition: transform 200ms ease-out, box-shadow 200ms ease-out;
}
.card-bento:hover { transform: translateY(-1px); box-shadow: var(--shadow-md); }
```

**Grid:** `grid-cols-2 gap-3` on mobile, `grid-cols-4` on tablet+. StatCard spans 1, StatusChart spans 2.

### List items (Flat — semua, semakan, status)

```css
.list-item {
  background: var(--surface);
  border-bottom: 1px solid var(--border);
  padding: 14px 16px;
  min-height: 56px;
  display: flex;
  align-items: center;
  gap: 12px;
  transition: background 200ms ease-out;
}
.list-item:active { background: var(--muted); }
```

No shadows. No card separation. Clean dividers only — iOS Settings / Reminders pattern.

### Inputs

```css
.input {
  height: 48px;
  padding: 0 16px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--surface);
  color: var(--fg);
  font-size: 16px; /* prevent iOS zoom */
  transition: border-color 200ms ease-out, box-shadow 200ms ease-out;
}
.input:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: var(--shadow-ring);
}
.input[aria-invalid="true"] {
  border-color: var(--destructive);
}
```

### Modals / Sheets

```css
.modal-overlay {
  background: rgba(15, 23, 42, 0.5);
  backdrop-filter: blur(8px);
  animation: fade-in 200ms ease-out;
}
.modal {
  background: var(--surface);
  border-radius: 20px;
  padding: 24px;
  box-shadow: var(--shadow-lg);
  max-width: 480px;
  animation: sheet-up 300ms var(--spring-gentle);
}
```

Mobile: slide up from bottom, `rounded-t-2xl rounded-b-none`, full width, swipe-down-to-dismiss with confirm if unsaved changes.

### State chips (Permohonan / Semakan / Pelaksanaan / Selesai / Tolak)

```css
.chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 24px;
  padding: 0 10px;
  border-radius: 6px;  /* STAMP, not pill */
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.01em;
}
.chip-pending    { background: #FEF3C7; color: #92400E; }  /* amber tint */
.chip-reviewing  { background: #DBEAFE; color: #1E40AF; }  /* blue tint */
.chip-executing  { background: #E0E7FF; color: #3730A3; }  /* indigo tint */
.chip-done       { background: #D1FAE5; color: #065F46; }  /* emerald tint */
.chip-rejected   { background: #FEE2E2; color: #991B1B; }  /* red tint */
```

### Bottom nav (PWA)

- Max 5 items (3 roles × specific screens = fits easily).
- 48px min touch, icon 20px + label 11px, active state = blue-600 icon + label + 2px top accent bar.
- `safe-area-inset-bottom` padding for iOS notch / home bar.
- Solid surface background, `shadow-md` top-side only.

---

## Iconography

- **Library:** Lucide React (already installed per Apr 12 work).
- **Stroke width:** Consistent `1.75` across all icons.
- **Size tokens:** `icon-sm` 16px, `icon-md` 20px (default), `icon-lg` 24px.
- **No emojis** for UI chrome ever. Emojis allowed only in user-generated content fields.

---

## Anti-patterns

- ❌ Neumorphism / puffy shadows — low contrast, fails hospital a11y
- ❌ Glassmorphism / backdrop-blur on content (only on modal overlays)
- ❌ Pills (rounded-full) on state chips or buttons — breaks institutional trust
- ❌ Gradients on buttons or cards — Apple Health uses solid fills, so do we
- ❌ Purple/pink AI-gradient aesthetics
- ❌ Hover-only affordances (PWA is touch-first)
- ❌ Text under 12px or body text under 16px on mobile
- ❌ Icon-only controls without aria-label
- ❌ Animating layout properties (width/height/top/left)
- ❌ Dark mode via `invert()` filter or color-swap only
- ❌ Removing focus rings

---

## Pre-Delivery Checklist

Before any PR merges:

**Visual**
- [ ] Inter font loaded via `next/font` (no FOIT, no layout shift)
- [ ] All icons Lucide, stroke 1.75, consistent sizing
- [ ] State chips use `radius-sm` (stamps not pills)
- [ ] No emojis in UI chrome
- [ ] Cards: Bento on dashboard only; flat list items elsewhere

**Interaction**
- [ ] 48px min touch targets (hospital a11y floor)
- [ ] Press feedback: scale 0.97, 140ms
- [ ] Transitions 140–300ms, `ease-out` enter / `ease-in` exit
- [ ] Focus rings visible on all interactive elements
- [ ] `prefers-reduced-motion` disables non-essential transitions

**Accessibility**
- [ ] Contrast 4.5:1 body text both themes
- [ ] Form labels visible (not placeholder-only)
- [ ] Errors announced via `aria-live` / `role="alert"`
- [ ] Tab order matches visual order
- [ ] Bahasa Melayu strings verified (no English leak)

**Responsive**
- [ ] 375px, 414px, 768px, 1024px tested
- [ ] Safe-area insets for iOS home bar + notch
- [ ] No horizontal scroll
- [ ] Bottom nav does not obscure list content (reserve padding)

**Dark mode**
- [ ] Both themes tested independently (not inferred)
- [ ] Border visibility in both themes
- [ ] Contrast verified per palette, not assumed
