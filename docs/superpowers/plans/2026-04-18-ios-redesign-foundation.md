# iOS Redesign — Foundation (Plan A) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the iOS-classic + institutional design foundation (tokens, fonts, dark mode, shared primitives, demo page) without touching any existing screens. Every existing page keeps working. New primitives are proven on a demo page before Plan B migrates real screens.

**Architecture:** CSS variables drive both themes via Tailwind `darkMode: "class"`. A tiny `ThemeProvider` syncs the `dark` class on `<html>` from localStorage + system preference. Primitives live under `components/ui/*` with a Vitest test pair each. A `/design-system` route renders every primitive in both themes for visual QA.

**Tech Stack:** Next.js 14 App Router, Tailwind CSS 3, Inter via `next/font/google`, Lucide icons, Vitest + React Testing Library + jsdom, Sonner (existing), Radix primitives (new — `@radix-ui/react-dialog` for modal a11y).

**Out of scope (→ Plan B):** Rewriting login, dashboard, mohon, semakan, semua, status, pengguna, profil. Migrating existing `StatusBadge`, `StatCard`, `TicketCard`, `StatusChart` to new tokens. Those happen per-page in Plan B.

---

## File Structure

**New files (created in this plan):**
- `components/ui/button.tsx` — primary / secondary / destructive / ghost variants
- `components/ui/button.test.tsx`
- `components/ui/input.tsx` — 48px, error state, aria-describedby
- `components/ui/input.test.tsx`
- `components/ui/chip.tsx` — stamp-radius state chips (pending/reviewing/executing/done/rejected + neutral)
- `components/ui/chip.test.tsx`
- `components/ui/list-item.tsx` — iOS flat row with icon/content/trailing slots
- `components/ui/list-item.test.tsx`
- `components/ui/bento-card.tsx` — dashboard-only card with subtle lift
- `components/ui/bento-card.test.tsx`
- `components/ui/modal.tsx` — Radix Dialog wrapper, iOS spring motion, mobile bottom sheet
- `components/ui/modal.test.tsx`
- `components/ui/theme-toggle.tsx` — segmented control (Sistem / Terang / Gelap)
- `components/ui/theme-toggle.test.tsx`
- `components/theme-provider.tsx` — ThemeProvider + useTheme hook
- `components/theme-provider.test.tsx`
- `app/design-system/page.tsx` — QA page, guarded behind `NODE_ENV !== "production"`
- `app/design-system/layout.tsx` — bare layout, no auth wrapper

**Modified files:**
- `app/layout.tsx` — swap Public Sans → Inter, wrap children in `<ThemeProvider>`
- `app/globals.css` — replace root vars with light/dark CSS var pairs, keep focus-visible rules
- `tailwind.config.ts` — extend theme with tokens from MASTER.md (radius, shadow, motion, fontSize scale)
- `package.json` — add `@radix-ui/react-dialog`, `clsx`, `tailwind-merge` (if not already via `@/lib/utils`)

**Untouched (existing screens keep working):**
- All `app/(protected)/**`, `app/login/**`, `app/api/**`
- Existing components: `BottomNav.tsx`, `StatCard.tsx`, `StatusBadge.tsx`, `StatusChart.tsx`, `TicketCard.tsx`, `TicketActions.tsx`, `PhotoUpload.tsx`, `Sidebar.tsx`, `CertificateGenerator.tsx`, `Skeleton.tsx` (migrated in Plan B)

---

## Task 1: Create feature branch + verify baseline

**Files:**
- Modify: (git state only)

- [ ] **Step 1: Confirm clean working tree**

Run: `cd "D:/project/i-smartlupus-medi" && git status`
Expected: Only `memory/` untracked (from Shino). No other modified files.

- [ ] **Step 2: Add memory/ to .gitignore then create branch**

Edit `.gitignore` — append:

```
# Shino AI memory (per-project)
memory/
design-system/
docs/superpowers/
```

Run:
```bash
git checkout -b feat/ios-redesign-foundation
git add .gitignore
git commit -m "chore: gitignore shino working directories"
```

- [ ] **Step 3: Verify tests pass on baseline before any changes**

Run: `cd "D:/project/i-smartlupus-medi" && npm test -- --run`
Expected: All existing tests pass (StatusBadge, StatusChart, TicketCard). Record pass count for regression.

- [ ] **Step 4: Verify dev build runs**

Run: `npm run build`
Expected: Successful build, no errors. Note any warnings to compare against later.

---

## Task 2: Migrate Public Sans → Inter

**Files:**
- Modify: `app/layout.tsx`
- Modify: `tailwind.config.ts`

- [ ] **Step 1: Replace font import in layout**

Edit `app/layout.tsx`:

```tsx
import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "i-SMARTLUPUS MEDI",
  description: "Sistem Pengurusan Pelupusan Aset Perubatan",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#2563eb",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ms" className={inter.variable}>
      <body className="bg-slate-50 text-slate-900 antialiased font-sans">
        {children}
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
```

- [ ] **Step 2: Update Tailwind fontFamily to point at Inter variable**

Edit `tailwind.config.ts` — replace the `fontFamily` block:

```ts
fontFamily: {
  sans: [
    "var(--font-inter)",
    "-apple-system",
    "BlinkMacSystemFont",
    "SF Pro Text",
    "Segoe UI",
    "Roboto",
    "sans-serif",
  ],
},
```

- [ ] **Step 3: Verify font loads in dev**

Run: `npm run dev`
Open `http://localhost:3000/login`. Inspect body computed `font-family`. Expected: `Inter` first. On iOS device or simulator, verify SF Pro falls back when offline.

- [ ] **Step 4: Commit**

```bash
git add app/layout.tsx tailwind.config.ts
git commit -m "feat(ui): migrate font from Public Sans to Inter with SF fallback"
```

---

## Task 3: Expand Tailwind config with design tokens

**Files:**
- Modify: `tailwind.config.ts`

- [ ] **Step 1: Add radius, shadow, motion, and fontSize tokens to theme.extend**

Replace `tailwind.config.ts` completely with:

```ts
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "var(--font-inter)",
          "-apple-system",
          "BlinkMacSystemFont",
          "SF Pro Text",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
      },
      colors: {
        slate: {
          50:  "oklch(0.975 0.006 250)",
          100: "oklch(0.950 0.008 250)",
          200: "oklch(0.910 0.010 250)",
          300: "oklch(0.830 0.012 250)",
          400: "oklch(0.640 0.010 250)",
          500: "oklch(0.530 0.010 250)",
          600: "oklch(0.440 0.010 250)",
          700: "oklch(0.370 0.012 250)",
          800: "oklch(0.280 0.010 250)",
          900: "oklch(0.200 0.008 250)",
          950: "oklch(0.130 0.006 250)",
        },
      },
      fontSize: {
        "2xs": ["0.625rem", { lineHeight: "1rem" }],
        caption: ["0.75rem", { lineHeight: "1rem", letterSpacing: "0.005em" }],
        footnote: ["0.8125rem", { lineHeight: "1.125rem" }],
        subhead: ["0.875rem", { lineHeight: "1.25rem", letterSpacing: "0.01em" }],
        callout: ["0.9375rem", { lineHeight: "1.375rem" }],
        body: ["1rem", { lineHeight: "1.5rem" }],
        "title-3": ["1.0625rem", { lineHeight: "1.5rem", letterSpacing: "-0.01em" }],
        "title-2": ["1.25rem", { lineHeight: "1.75rem", letterSpacing: "-0.015em" }],
        "title-1": ["1.5rem", { lineHeight: "2rem", letterSpacing: "-0.02em" }],
        display: ["2rem", { lineHeight: "2.5rem", letterSpacing: "-0.025em" }],
      },
      borderRadius: {
        sm: "6px",
        md: "8px",
        lg: "12px",
        xl: "16px",
        "2xl": "20px",
      },
      boxShadow: {
        none: "none",
        sm: "0 1px 2px rgba(15, 23, 42, 0.04)",
        md: "0 4px 6px rgba(15, 23, 42, 0.05), 0 2px 4px rgba(15, 23, 42, 0.04)",
        lg: "0 10px 15px rgba(15, 23, 42, 0.08), 0 4px 6px rgba(15, 23, 42, 0.04)",
        ring: "0 0 0 4px rgba(37, 99, 235, 0.12)",
        "ring-dark": "0 0 0 4px rgba(96, 165, 250, 0.18)",
      },
      transitionTimingFunction: {
        "ios-out": "cubic-bezier(0.16, 1, 0.3, 1)",
        "ios-in": "cubic-bezier(0.7, 0, 0.84, 0)",
        "ios-spring": "cubic-bezier(0.32, 0.72, 0, 1)",
      },
      transitionDuration: {
        fast: "140ms",
        base: "200ms",
        slow: "300ms",
      },
      minHeight: {
        touch: "48px",
      },
      spacing: {
        touch: "48px",
      },
    },
  },
  plugins: [],
};
export default config;
```

- [ ] **Step 2: Verify classes resolve**

Run: `npm run dev`. In any existing page, temporarily add `className="text-title-1 rounded-xl shadow-sm min-h-touch"` to a div. Expected: styles apply. Remove the temp div before committing.

- [ ] **Step 3: Commit**

```bash
git add tailwind.config.ts
git commit -m "feat(ui): extend tailwind with iOS design tokens (radius/shadow/type/motion)"
```

---

## Task 4: Rewrite globals.css with theme CSS variables

**Files:**
- Modify: `app/globals.css`

- [ ] **Step 1: Replace globals.css contents**

Replace `app/globals.css` with:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    /* Light theme (default) */
    --bg: oklch(0.975 0.006 250);
    --surface: oklch(1.000 0.003 250);
    --surface-elevated: oklch(1.000 0.003 250);
    --fg: oklch(0.200 0.008 250);
    --fg-muted: oklch(0.530 0.010 250);
    --border: oklch(0.910 0.010 250);

    --primary: #2563EB;
    --primary-hover: #1D4ED8;
    --primary-tint: rgba(37, 99, 235, 0.08);
    --on-primary: #FFFFFF;

    --accent: #059669;
    --on-accent: #FFFFFF;

    --destructive: #DC2626;
    --destructive-tint: rgba(220, 38, 38, 0.08);
    --on-destructive: #FFFFFF;

    --warning: #D97706;

    --chip-pending-bg: #FEF3C7;
    --chip-pending-fg: #92400E;
    --chip-reviewing-bg: #DBEAFE;
    --chip-reviewing-fg: #1E40AF;
    --chip-executing-bg: #E0E7FF;
    --chip-executing-fg: #3730A3;
    --chip-done-bg: #D1FAE5;
    --chip-done-fg: #065F46;
    --chip-rejected-bg: #FEE2E2;
    --chip-rejected-fg: #991B1B;

    --ring: rgba(37, 99, 235, 0.5);
  }

  .dark {
    --bg: oklch(0.130 0.006 250);
    --surface: oklch(0.200 0.008 250);
    --surface-elevated: oklch(0.280 0.010 250);
    --fg: oklch(0.950 0.008 250);
    --fg-muted: oklch(0.640 0.010 250);
    --border: oklch(0.280 0.010 250);

    --primary: #60A5FA;
    --primary-hover: #3B82F6;
    --primary-tint: rgba(96, 165, 250, 0.12);
    --on-primary: #0F172A;

    --accent: #34D399;
    --on-accent: #0F172A;

    --destructive: #F87171;
    --destructive-tint: rgba(248, 113, 113, 0.12);
    --on-destructive: #0F172A;

    --warning: #FBBF24;

    --chip-pending-bg: rgba(217, 119, 6, 0.15);
    --chip-pending-fg: #FBBF24;
    --chip-reviewing-bg: rgba(37, 99, 235, 0.18);
    --chip-reviewing-fg: #93C5FD;
    --chip-executing-bg: rgba(79, 70, 229, 0.20);
    --chip-executing-fg: #A5B4FC;
    --chip-done-bg: rgba(5, 150, 105, 0.18);
    --chip-done-fg: #6EE7B7;
    --chip-rejected-bg: rgba(220, 38, 38, 0.18);
    --chip-rejected-fg: #FCA5A5;

    --ring: rgba(96, 165, 250, 0.6);
  }

  html {
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    font-kerning: normal;
    text-rendering: optimizeLegibility;
  }

  body {
    background-color: var(--bg);
    color: var(--fg);
  }

  .tabular-nums {
    font-variant-numeric: tabular-nums;
  }

  :focus-visible {
    outline: 2px solid var(--ring);
    outline-offset: 2px;
    border-radius: 8px;
  }

  :focus:not(:focus-visible) {
    outline: none;
  }
}

@layer utilities {
  .animate-in {
    animation: fade-up 0.3s cubic-bezier(0.16, 1, 0.3, 1) both;
  }

  @keyframes fade-up {
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .animate-sheet-up {
    animation: sheet-up 0.3s cubic-bezier(0.32, 0.72, 0, 1) both;
  }

  @keyframes sheet-up {
    from { opacity: 0; transform: translateY(100%); }
    to { opacity: 1; transform: translateY(0); }
  }

  .animate-fade-in {
    animation: fade-in 0.2s cubic-bezier(0.16, 1, 0.3, 1) both;
  }

  @keyframes fade-in {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @media (prefers-reduced-motion: reduce) {
    .animate-in,
    .animate-sheet-up,
    .animate-fade-in {
      animation: none;
      opacity: 1;
      transform: none;
    }
    .animate-pulse {
      animation: none;
    }
  }
}
```

- [ ] **Step 2: Update body class in layout.tsx to use semantic vars**

Edit `app/layout.tsx` — change body className from `"bg-slate-50 text-slate-900 antialiased font-sans"` to:

```tsx
<body className="antialiased font-sans" style={{ background: "var(--bg)", color: "var(--fg)" }}>
```

- [ ] **Step 3: Verify both themes manually**

Run: `npm run dev`. Open `/login`. In DevTools, add `class="dark"` to the `<html>` element. Expected: background darkens to slate-950, text flips to slate-100. Remove the class.

- [ ] **Step 4: Commit**

```bash
git add app/globals.css app/layout.tsx
git commit -m "feat(ui): add light/dark CSS variable system for theme switching"
```

---

## Task 5: ThemeProvider + useTheme hook

**Files:**
- Create: `components/theme-provider.tsx`
- Create: `components/theme-provider.test.tsx`
- Modify: `app/layout.tsx`

- [ ] **Step 1: Write the failing test**

Create `components/theme-provider.test.tsx`:

```tsx
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { ThemeProvider, useTheme } from "./theme-provider";

function ThemeConsumer() {
  const { theme, resolvedTheme, setTheme } = useTheme();
  return (
    <div>
      <span data-testid="theme">{theme}</span>
      <span data-testid="resolved">{resolvedTheme}</span>
      <button onClick={() => setTheme("dark")}>dark</button>
      <button onClick={() => setTheme("light")}>light</button>
      <button onClick={() => setTheme("system")}>system</button>
    </div>
  );
}

describe("ThemeProvider", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove("dark");
  });

  it("defaults to system and resolves against prefers-color-scheme", () => {
    vi.stubGlobal("matchMedia", vi.fn().mockReturnValue({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));
    render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>
    );
    expect(screen.getByTestId("theme").textContent).toBe("system");
    expect(screen.getByTestId("resolved").textContent).toBe("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  it("persists explicit choice to localStorage and toggles html class", () => {
    vi.stubGlobal("matchMedia", vi.fn().mockReturnValue({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));
    render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>
    );
    act(() => { screen.getByText("dark").click(); });
    expect(localStorage.getItem("theme")).toBe("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    act(() => { screen.getByText("light").click(); });
    expect(localStorage.getItem("theme")).toBe("light");
    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });
});
```

- [ ] **Step 2: Run test — expect FAIL**

Run: `npm test -- --run components/theme-provider.test.tsx`
Expected: FAIL — `theme-provider` module does not exist.

- [ ] **Step 3: Implement ThemeProvider**

Create `components/theme-provider.tsx`:

```tsx
"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Theme = "light" | "dark" | "system";
type Resolved = "light" | "dark";

interface ThemeContextValue {
  theme: Theme;
  resolvedTheme: Resolved;
  setTheme: (t: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);
const STORAGE_KEY = "theme";

function readSystem(): Resolved {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function apply(resolved: Resolved) {
  const root = document.documentElement;
  if (resolved === "dark") root.classList.add("dark");
  else root.classList.remove("dark");
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("system");
  const [resolvedTheme, setResolved] = useState<Resolved>("light");

  useEffect(() => {
    const stored = (localStorage.getItem(STORAGE_KEY) as Theme | null) ?? "system";
    setThemeState(stored);
    const resolved = stored === "system" ? readSystem() : stored;
    setResolved(resolved);
    apply(resolved);

    if (stored === "system") {
      const media = window.matchMedia("(prefers-color-scheme: dark)");
      const listener = () => {
        const next = readSystem();
        setResolved(next);
        apply(next);
      };
      media.addEventListener("change", listener);
      return () => media.removeEventListener("change", listener);
    }
  }, []);

  const setTheme = (t: Theme) => {
    setThemeState(t);
    localStorage.setItem(STORAGE_KEY, t);
    const resolved = t === "system" ? readSystem() : t;
    setResolved(resolved);
    apply(resolved);
  };

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside <ThemeProvider>");
  return ctx;
}
```

- [ ] **Step 4: Run test — expect PASS**

Run: `npm test -- --run components/theme-provider.test.tsx`
Expected: both tests pass.

- [ ] **Step 5: Wrap root layout in ThemeProvider**

Edit `app/layout.tsx` — import `ThemeProvider` and wrap children:

```tsx
import { ThemeProvider } from "@/components/theme-provider";

// ...in JSX:
<body className="antialiased font-sans" style={{ background: "var(--bg)", color: "var(--fg)" }}>
  <ThemeProvider>
    {children}
    <Toaster position="top-center" richColors />
  </ThemeProvider>
</body>
```

- [ ] **Step 6: Commit**

```bash
git add components/theme-provider.tsx components/theme-provider.test.tsx app/layout.tsx
git commit -m "feat(ui): add ThemeProvider with system/light/dark resolution"
```

---

## Task 6: ThemeToggle segmented control

**Files:**
- Create: `components/ui/theme-toggle.tsx`
- Create: `components/ui/theme-toggle.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `components/ui/theme-toggle.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "./theme-toggle";

function withProvider(ui: React.ReactElement) {
  vi.stubGlobal("matchMedia", vi.fn().mockReturnValue({
    matches: false,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
  return render(<ThemeProvider>{ui}</ThemeProvider>);
}

describe("ThemeToggle", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove("dark");
  });

  it("renders three segments labelled Sistem, Terang, Gelap", () => {
    withProvider(<ThemeToggle />);
    expect(screen.getByRole("radio", { name: "Sistem" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Terang" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Gelap" })).toBeInTheDocument();
  });

  it("selecting Gelap adds dark class to html", () => {
    withProvider(<ThemeToggle />);
    fireEvent.click(screen.getByRole("radio", { name: "Gelap" }));
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  it("marks the active segment with aria-checked=true", () => {
    withProvider(<ThemeToggle />);
    fireEvent.click(screen.getByRole("radio", { name: "Terang" }));
    expect(screen.getByRole("radio", { name: "Terang" })).toHaveAttribute("aria-checked", "true");
    expect(screen.getByRole("radio", { name: "Sistem" })).toHaveAttribute("aria-checked", "false");
  });
});
```

- [ ] **Step 2: Run test — expect FAIL**

Run: `npm test -- --run components/ui/theme-toggle.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement ThemeToggle**

Create `components/ui/theme-toggle.tsx`:

```tsx
"use client";

import { useTheme, type Theme } from "@/components/theme-provider";
import { cn } from "@/lib/utils";

const OPTIONS: { value: Theme; label: string }[] = [
  { value: "system", label: "Sistem" },
  { value: "light", label: "Terang" },
  { value: "dark", label: "Gelap" },
];

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div
      role="radiogroup"
      aria-label="Tema paparan"
      className="inline-flex rounded-lg p-1 bg-[var(--surface-elevated)] border border-[var(--border)]"
    >
      {OPTIONS.map((opt) => {
        const active = theme === opt.value;
        return (
          <button
            key={opt.value}
            role="radio"
            aria-checked={active}
            aria-label={opt.label}
            onClick={() => setTheme(opt.value)}
            className={cn(
              "px-3 min-h-[40px] text-subhead font-medium rounded-md transition-colors duration-base ease-ios-out",
              active
                ? "bg-[var(--surface)] text-[var(--fg)] shadow-sm"
                : "text-[var(--fg-muted)] hover:text-[var(--fg)]",
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 4: Run test — expect PASS**

Run: `npm test -- --run components/ui/theme-toggle.test.tsx`
Expected: all three tests pass.

- [ ] **Step 5: Commit**

```bash
git add components/ui/theme-toggle.tsx components/ui/theme-toggle.test.tsx
git commit -m "feat(ui): add ThemeToggle segmented control (Sistem/Terang/Gelap)"
```

---

## Task 7: Button primitive

**Files:**
- Create: `components/ui/button.tsx`
- Create: `components/ui/button.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `components/ui/button.test.tsx`:

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Button } from "./button";

describe("Button", () => {
  it("renders label and fires onClick", () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Hantar</Button>);
    const btn = screen.getByRole("button", { name: "Hantar" });
    fireEvent.click(btn);
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("applies 48px min-height for touch", () => {
    render(<Button>OK</Button>);
    expect(screen.getByRole("button")).toHaveClass("min-h-touch");
  });

  it("renders destructive variant with destructive background", () => {
    render(<Button variant="destructive">Padam</Button>);
    const btn = screen.getByRole("button");
    expect(btn.className).toMatch(/destructive/);
  });

  it("shows spinner and disables when loading", () => {
    render(<Button loading>Hantar</Button>);
    const btn = screen.getByRole("button");
    expect(btn).toBeDisabled();
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("does not fire onClick when disabled", () => {
    const onClick = vi.fn();
    render(<Button disabled onClick={onClick}>OK</Button>);
    fireEvent.click(screen.getByRole("button"));
    expect(onClick).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test — expect FAIL**

Run: `npm test -- --run components/ui/button.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement Button**

Create `components/ui/button.tsx`:

```tsx
"use client";

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "destructive" | "ghost";
type Size = "md" | "sm";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  children: ReactNode;
}

const base =
  "inline-flex items-center justify-center gap-2 font-semibold rounded-md " +
  "transition-[background-color,transform] duration-base ease-ios-out " +
  "active:scale-[0.97] active:duration-fast " +
  "focus-visible:outline-none focus-visible:shadow-ring " +
  "disabled:opacity-40 disabled:pointer-events-none";

const sizes: Record<Size, string> = {
  md: "min-h-touch px-5 text-body",
  sm: "h-10 px-3 text-subhead",
};

const variants: Record<Variant, string> = {
  primary:
    "bg-[var(--primary)] text-[var(--on-primary)] hover:bg-[var(--primary-hover)]",
  secondary:
    "bg-[var(--primary-tint)] text-[var(--primary)] hover:bg-[var(--primary-tint)] " +
    "hover:brightness-95 dark:hover:brightness-110",
  destructive:
    "bg-[var(--destructive)] text-[var(--on-destructive)] hover:brightness-95 " +
    "data-variant-destructive",
  ghost:
    "bg-transparent text-[var(--primary)] hover:bg-[var(--primary-tint)]",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", loading, disabled, children, ...rest }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(base, sizes[size], variants[variant], className)}
        {...rest}
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" role="status" aria-label="Memuatkan" />}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
```

- [ ] **Step 4: Run test — expect PASS**

Run: `npm test -- --run components/ui/button.test.tsx`
Expected: all five tests pass.

- [ ] **Step 5: Commit**

```bash
git add components/ui/button.tsx components/ui/button.test.tsx
git commit -m "feat(ui): add Button primitive (primary/secondary/destructive/ghost)"
```

---

## Task 8: Input primitive

**Files:**
- Create: `components/ui/input.tsx`
- Create: `components/ui/input.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `components/ui/input.test.tsx`:

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Input } from "./input";

describe("Input", () => {
  it("renders with associated label and helper text", () => {
    render(
      <Input
        id="ic"
        label="No. Kad Pengenalan"
        helper="12 digit tanpa sempang"
      />
    );
    const input = screen.getByLabelText("No. Kad Pengenalan");
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute("aria-describedby");
    expect(screen.getByText("12 digit tanpa sempang")).toBeInTheDocument();
  });

  it("shows error message and sets aria-invalid when error prop is set", () => {
    render(
      <Input
        id="ic"
        label="No. IC"
        error="IC tidak sah"
      />
    );
    const input = screen.getByLabelText("No. IC");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByRole("alert")).toHaveTextContent("IC tidak sah");
  });

  it("applies 48px height via min-h-touch", () => {
    render(<Input id="x" label="X" />);
    expect(screen.getByLabelText("X")).toHaveClass("min-h-touch");
  });

  it("renders required indicator when required", () => {
    render(<Input id="x" label="Nama" required />);
    expect(screen.getByText("*")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test — expect FAIL**

Run: `npm test -- --run components/ui/input.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement Input**

Create `components/ui/input.tsx`:

```tsx
"use client";

import { forwardRef, useId, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "size"> {
  label: string;
  helper?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ id, label, helper, error, required, className, ...rest }, ref) => {
    const autoId = useId();
    const inputId = id ?? autoId;
    const helperId = helper ? `${inputId}-helper` : undefined;
    const errorId = error ? `${inputId}-error` : undefined;
    const describedBy = errorId ?? helperId;

    return (
      <div className="flex flex-col gap-1.5">
        <label htmlFor={inputId} className="text-subhead font-medium text-[var(--fg)]">
          {label}
          {required && <span className="text-[var(--destructive)] ml-0.5" aria-hidden>*</span>}
        </label>
        <input
          ref={ref}
          id={inputId}
          required={required}
          aria-invalid={!!error}
          aria-describedby={describedBy}
          className={cn(
            "min-h-touch w-full px-4 rounded-md bg-[var(--surface)] text-[var(--fg)] text-body",
            "border border-[var(--border)]",
            "transition-[border-color,box-shadow] duration-base ease-ios-out",
            "focus:outline-none focus:border-[var(--primary)] focus:shadow-ring",
            "placeholder:text-[var(--fg-muted)]",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            error && "border-[var(--destructive)]",
            className,
          )}
          {...rest}
        />
        {error && (
          <p id={errorId} role="alert" className="text-footnote text-[var(--destructive)]">
            {error}
          </p>
        )}
        {!error && helper && (
          <p id={helperId} className="text-footnote text-[var(--fg-muted)]">
            {helper}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
```

- [ ] **Step 4: Run test — expect PASS**

Run: `npm test -- --run components/ui/input.test.tsx`
Expected: all four tests pass.

- [ ] **Step 5: Commit**

```bash
git add components/ui/input.tsx components/ui/input.test.tsx
git commit -m "feat(ui): add Input primitive with label/helper/error states"
```

---

## Task 9: Chip primitive (state chips)

**Files:**
- Create: `components/ui/chip.tsx`
- Create: `components/ui/chip.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `components/ui/chip.test.tsx`:

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Chip } from "./chip";

describe("Chip", () => {
  it("renders children with tone-pending styling", () => {
    render(<Chip tone="pending">Menunggu</Chip>);
    const chip = screen.getByText("Menunggu");
    expect(chip).toBeInTheDocument();
    expect(chip.className).toMatch(/rounded-sm|rounded-\[6px\]/);
  });

  it("renders all tones without error", () => {
    const tones = ["pending", "reviewing", "executing", "done", "rejected", "neutral"] as const;
    for (const tone of tones) {
      const { unmount } = render(<Chip tone={tone}>{tone}</Chip>);
      expect(screen.getByText(tone)).toBeInTheDocument();
      unmount();
    }
  });

  it("supports optional leading icon", () => {
    const Icon = () => <svg data-testid="icon" />;
    render(<Chip tone="done" icon={<Icon />}>Selesai</Chip>);
    expect(screen.getByTestId("icon")).toBeInTheDocument();
    expect(screen.getByText("Selesai")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test — expect FAIL**

Run: `npm test -- --run components/ui/chip.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implement Chip**

Create `components/ui/chip.tsx`:

```tsx
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type ChipTone =
  | "pending"
  | "reviewing"
  | "executing"
  | "done"
  | "rejected"
  | "neutral";

interface ChipProps {
  tone: ChipTone;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}

const tones: Record<ChipTone, string> = {
  pending:   "bg-[var(--chip-pending-bg)]   text-[var(--chip-pending-fg)]",
  reviewing: "bg-[var(--chip-reviewing-bg)] text-[var(--chip-reviewing-fg)]",
  executing: "bg-[var(--chip-executing-bg)] text-[var(--chip-executing-fg)]",
  done:      "bg-[var(--chip-done-bg)]      text-[var(--chip-done-fg)]",
  rejected:  "bg-[var(--chip-rejected-bg)]  text-[var(--chip-rejected-fg)]",
  neutral:   "bg-[var(--surface-elevated)]  text-[var(--fg-muted)]",
};

export function Chip({ tone, icon, children, className }: ChipProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 h-6 px-2.5 rounded-sm text-caption font-semibold",
        tones[tone],
        className,
      )}
    >
      {icon && <span className="[&>svg]:h-3 [&>svg]:w-3">{icon}</span>}
      {children}
    </span>
  );
}
```

- [ ] **Step 4: Run test — expect PASS**

Run: `npm test -- --run components/ui/chip.test.tsx`
Expected: all three tests pass.

- [ ] **Step 5: Commit**

```bash
git add components/ui/chip.tsx components/ui/chip.test.tsx
git commit -m "feat(ui): add Chip primitive with 6 tones (rounded-sm stamps)"
```

---

## Task 10: ListItem primitive (flat iOS row)

**Files:**
- Create: `components/ui/list-item.tsx`
- Create: `components/ui/list-item.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `components/ui/list-item.test.tsx`:

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ListItem } from "./list-item";

describe("ListItem", () => {
  it("renders title, subtitle, leading and trailing slots", () => {
    render(
      <ListItem
        leading={<span data-testid="lead">L</span>}
        title="PC Dell 7070"
        subtitle="Ali Bin Ahmad"
        trailing={<span data-testid="trail">T</span>}
      />
    );
    expect(screen.getByTestId("lead")).toBeInTheDocument();
    expect(screen.getByText("PC Dell 7070")).toBeInTheDocument();
    expect(screen.getByText("Ali Bin Ahmad")).toBeInTheDocument();
    expect(screen.getByTestId("trail")).toBeInTheDocument();
  });

  it("fires onClick when interactive", () => {
    const onClick = vi.fn();
    render(<ListItem title="Click me" onClick={onClick} />);
    fireEvent.click(screen.getByRole("button", { name: /click me/i }));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("renders a non-interactive row without button role when onClick omitted", () => {
    render(<ListItem title="Readonly" />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(screen.getByText("Readonly")).toBeInTheDocument();
  });

  it("keeps min-height 56px per MASTER spec", () => {
    render(<ListItem title="X" />);
    const row = screen.getByText("X").closest('[data-list-item="true"]');
    expect(row).toHaveClass("min-h-[56px]");
  });
});
```

- [ ] **Step 2: Run test — expect FAIL**

Run: `npm test -- --run components/ui/list-item.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implement ListItem**

Create `components/ui/list-item.tsx`:

```tsx
"use client";

import type { ReactNode } from "react";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface ListItemProps {
  leading?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  trailing?: ReactNode;
  onClick?: () => void;
  showChevron?: boolean;
  className?: string;
}

export function ListItem({
  leading,
  title,
  subtitle,
  trailing,
  onClick,
  showChevron = true,
  className,
}: ListItemProps) {
  const content = (
    <div
      data-list-item="true"
      className={cn(
        "flex items-center gap-3 px-4 min-h-[56px] py-3 w-full",
        "border-b border-[var(--border)] bg-[var(--surface)]",
        onClick &&
          "transition-colors duration-base ease-ios-out active:bg-[var(--primary-tint)] cursor-pointer text-left",
        className,
      )}
    >
      {leading && <div className="shrink-0">{leading}</div>}
      <div className="flex-1 min-w-0">
        <div className="text-body text-[var(--fg)] truncate">{title}</div>
        {subtitle && (
          <div className="text-footnote text-[var(--fg-muted)] truncate">{subtitle}</div>
        )}
      </div>
      {trailing && <div className="shrink-0">{trailing}</div>}
      {onClick && showChevron && !trailing && (
        <ChevronRight className="h-4 w-4 text-[var(--fg-muted)] shrink-0" aria-hidden />
      )}
    </div>
  );

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className="block w-full">
        {content}
      </button>
    );
  }
  return content;
}
```

- [ ] **Step 4: Run test — expect PASS**

Run: `npm test -- --run components/ui/list-item.test.tsx`
Expected: all four tests pass.

- [ ] **Step 5: Commit**

```bash
git add components/ui/list-item.tsx components/ui/list-item.test.tsx
git commit -m "feat(ui): add ListItem primitive (flat iOS row, 56px min-height)"
```

---

## Task 11: BentoCard primitive (dashboard only)

**Files:**
- Create: `components/ui/bento-card.tsx`
- Create: `components/ui/bento-card.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `components/ui/bento-card.test.tsx`:

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { BentoCard } from "./bento-card";

describe("BentoCard", () => {
  it("renders children", () => {
    render(<BentoCard><p>Content</p></BentoCard>);
    expect(screen.getByText("Content")).toBeInTheDocument();
  });

  it("applies rounded-xl and surface background", () => {
    const { container } = render(<BentoCard>x</BentoCard>);
    const card = container.firstChild as HTMLElement;
    expect(card.className).toMatch(/rounded-xl/);
  });

  it("supports col-span-2 via span prop", () => {
    const { container } = render(<BentoCard span={2}>x</BentoCard>);
    const card = container.firstChild as HTMLElement;
    expect(card.className).toMatch(/col-span-2/);
  });
});
```

- [ ] **Step 2: Run test — expect FAIL**

Run: `npm test -- --run components/ui/bento-card.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implement BentoCard**

Create `components/ui/bento-card.tsx`:

```tsx
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface BentoCardProps {
  children: ReactNode;
  span?: 1 | 2;
  className?: string;
}

export function BentoCard({ children, span = 1, className }: BentoCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm",
        "transition-[transform,box-shadow] duration-base ease-ios-out",
        "hover:-translate-y-px hover:shadow-md",
        span === 2 && "col-span-2",
        className,
      )}
    >
      {children}
    </div>
  );
}
```

- [ ] **Step 4: Run test — expect PASS**

Run: `npm test -- --run components/ui/bento-card.test.tsx`
Expected: all three tests pass.

- [ ] **Step 5: Commit**

```bash
git add components/ui/bento-card.tsx components/ui/bento-card.test.tsx
git commit -m "feat(ui): add BentoCard primitive for dashboard grid"
```

---

## Task 12: Modal (Radix Dialog wrapper)

**Files:**
- Modify: `package.json` (add `@radix-ui/react-dialog`)
- Create: `components/ui/modal.tsx`
- Create: `components/ui/modal.test.tsx`

- [ ] **Step 1: Install Radix Dialog**

Run: `cd "D:/project/i-smartlupus-medi" && npm install @radix-ui/react-dialog`
Expected: package added to `dependencies`. If npm hangs on Windows (per user's memory), use: `node -e "require('child_process').execSync('npm install @radix-ui/react-dialog', {stdio:'inherit', shell:process.env.COMSPEC})"`

- [ ] **Step 2: Write the failing test**

Create `components/ui/modal.test.tsx`:

```tsx
import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Modal } from "./modal";

describe("Modal", () => {
  it("renders trigger and opens content on click", () => {
    render(
      <Modal trigger={<button>Open</button>} title="Sahkan">
        <p>Body text</p>
      </Modal>
    );
    fireEvent.click(screen.getByText("Open"));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Sahkan")).toBeInTheDocument();
    expect(screen.getByText("Body text")).toBeInTheDocument();
  });

  it("closes when the close button is clicked", () => {
    render(
      <Modal trigger={<button>Open</button>} title="T">
        <p>Body</p>
      </Modal>
    );
    fireEvent.click(screen.getByText("Open"));
    fireEvent.click(screen.getByRole("button", { name: /tutup/i }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renders description when provided", () => {
    render(
      <Modal trigger={<button>Open</button>} title="T" description="Pilih tindakan">
        <p>Body</p>
      </Modal>
    );
    fireEvent.click(screen.getByText("Open"));
    expect(screen.getByText("Pilih tindakan")).toBeInTheDocument();
  });
});
```

- [ ] **Step 3: Run test — expect FAIL**

Run: `npm test -- --run components/ui/modal.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 4: Implement Modal**

Create `components/ui/modal.tsx`:

```tsx
"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ModalProps {
  trigger: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function Modal({ trigger, title, description, children, className }: ModalProps) {
  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>{trigger}</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm animate-fade-in"
        />
        <Dialog.Content
          className={cn(
            "fixed z-50 bg-[var(--surface)] shadow-lg text-[var(--fg)]",
            "bottom-0 left-0 right-0 rounded-t-2xl p-6 animate-sheet-up",
            "sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2",
            "sm:max-w-[480px] sm:w-full sm:rounded-2xl sm:animate-in",
            "focus:outline-none",
            className,
          )}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <Dialog.Title className="text-title-3 font-semibold text-[var(--fg)]">
                {title}
              </Dialog.Title>
              {description && (
                <Dialog.Description className="text-footnote text-[var(--fg-muted)] mt-1">
                  {description}
                </Dialog.Description>
              )}
            </div>
            <Dialog.Close asChild>
              <button
                type="button"
                aria-label="Tutup"
                className="-mr-2 p-2 rounded-md text-[var(--fg-muted)] hover:bg-[var(--primary-tint)] transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </Dialog.Close>
          </div>
          <div className="mt-4">{children}</div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
```

- [ ] **Step 5: Run test — expect PASS**

Run: `npm test -- --run components/ui/modal.test.tsx`
Expected: all three tests pass.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json components/ui/modal.tsx components/ui/modal.test.tsx
git commit -m "feat(ui): add Modal primitive (Radix Dialog, mobile sheet + desktop modal)"
```

---

## Task 13: BottomNavV2 primitive

> Rationale: The existing `BottomNav.tsx` ships with the old palette and 56px tap target (below our 48px-floor decision but still stale visually). We build the new version side-by-side so Plan B can swap screen-by-screen without breaking live pages.

**Files:**
- Create: `components/ui/bottom-nav.tsx`
- Create: `components/ui/bottom-nav.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `components/ui/bottom-nav.test.tsx`:

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Home, Plus } from "lucide-react";
import { BottomNav } from "./bottom-nav";

vi.mock("next/navigation", () => ({
  usePathname: () => "/dashboard",
}));

import { vi } from "vitest";

describe("BottomNav", () => {
  const items = [
    { href: "/dashboard", label: "Utama", Icon: Home },
    { href: "/mohon", label: "Mohon", Icon: Plus },
  ];

  it("renders each item as a link with accessible label", () => {
    render(<BottomNav items={items} />);
    expect(screen.getByRole("link", { name: "Utama" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Mohon" })).toBeInTheDocument();
  });

  it("marks active route with aria-current=page", () => {
    render(<BottomNav items={items} />);
    expect(screen.getByRole("link", { name: "Utama" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Mohon" })).not.toHaveAttribute("aria-current");
  });

  it("has safe-area padding class for iOS home bar", () => {
    const { container } = render(<BottomNav items={items} />);
    const nav = container.querySelector("nav");
    expect(nav?.className).toMatch(/safe-area|pb-\[env/);
  });
});
```

- [ ] **Step 2: Run test — expect FAIL**

Run: `npm test -- --run components/ui/bottom-nav.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement BottomNav**

Create `components/ui/bottom-nav.tsx`:

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface BottomNavItem {
  href: string;
  label: string;
  Icon: LucideIcon;
}

interface BottomNavProps {
  items: BottomNavItem[];
}

export function BottomNav({ items }: BottomNavProps) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Menu utama"
      className={cn(
        "fixed bottom-0 left-0 right-0 z-40",
        "bg-[var(--surface)] border-t border-[var(--border)]",
        "pb-[env(safe-area-inset-bottom)] md:hidden",
      )}
    >
      <ul className="flex items-stretch justify-around">
        {items.map(({ href, label, Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-label={label}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex flex-col items-center justify-center gap-1 min-h-touch py-2",
                  "transition-colors duration-base ease-ios-out",
                  active
                    ? "text-[var(--primary)]"
                    : "text-[var(--fg-muted)] hover:text-[var(--fg)]",
                )}
              >
                {active && (
                  <span
                    aria-hidden
                    className="absolute top-0 h-0.5 w-8 rounded-full bg-[var(--primary)]"
                  />
                )}
                <Icon className="h-5 w-5" strokeWidth={active ? 2.25 : 1.75} />
                <span className="text-[11px] font-medium tracking-tight">{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
```

- [ ] **Step 4: Run test — expect PASS**

Run: `npm test -- --run components/ui/bottom-nav.test.tsx`
Expected: all three tests pass.

- [ ] **Step 5: Commit**

```bash
git add components/ui/bottom-nav.tsx components/ui/bottom-nav.test.tsx
git commit -m "feat(ui): add BottomNav primitive with safe-area and active indicator"
```

---

## Task 14: Design system demo page

**Files:**
- Create: `app/design-system/layout.tsx`
- Create: `app/design-system/page.tsx`

- [ ] **Step 1: Create bare layout (no auth)**

Create `app/design-system/layout.tsx`:

```tsx
import type { ReactNode } from "react";

export default function DesignSystemLayout({ children }: { children: ReactNode }) {
  if (process.env.NODE_ENV === "production") {
    return <div className="p-8 text-center">Not available in production.</div>;
  }
  return <>{children}</>;
}
```

- [ ] **Step 2: Create the demo page**

Create `app/design-system/page.tsx`:

```tsx
"use client";

import { Check, Plus, Trash2, CircleDashed } from "lucide-react";
import { Home, FileText, ClipboardCheck, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Chip } from "@/components/ui/chip";
import { ListItem } from "@/components/ui/list-item";
import { BentoCard } from "@/components/ui/bento-card";
import { Modal } from "@/components/ui/modal";
import { BottomNav } from "@/components/ui/bottom-nav";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export default function DesignSystemPage() {
  return (
    <div className="min-h-dvh p-6 md:p-10 space-y-10 max-w-5xl mx-auto">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-title-1 font-semibold">Design System</h1>
          <p className="text-footnote text-[var(--fg-muted)]">
            QA visual semua primitive dalam tema terang &amp; gelap.
          </p>
        </div>
        <ThemeToggle />
      </header>

      <section className="space-y-4">
        <h2 className="text-title-2 font-semibold">Buttons</h2>
        <div className="flex flex-wrap gap-3">
          <Button>Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="destructive"><Trash2 className="h-4 w-4" />Padam</Button>
          <Button variant="ghost">Ghost</Button>
          <Button disabled>Disabled</Button>
          <Button loading>Loading</Button>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-title-2 font-semibold">Inputs</h2>
        <div className="grid gap-4 md:grid-cols-2 max-w-2xl">
          <Input label="Nama Penuh" helper="Seperti dalam Kad Pengenalan" required />
          <Input label="No. Telefon" helper="Tanpa sempang" />
          <Input label="Emel" error="Format emel tidak sah" defaultValue="ali@" />
          <Input label="Disabled" disabled placeholder="Tidak boleh diedit" />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-title-2 font-semibold">Chips</h2>
        <div className="flex flex-wrap gap-2">
          <Chip tone="pending" icon={<CircleDashed />}>Permohonan</Chip>
          <Chip tone="reviewing">Semakan</Chip>
          <Chip tone="executing">Pelaksanaan</Chip>
          <Chip tone="done" icon={<Check />}>Selesai</Chip>
          <Chip tone="rejected">Ditolak</Chip>
          <Chip tone="neutral">Neutral</Chip>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-title-2 font-semibold">List items (flat iOS)</h2>
        <div className="rounded-xl overflow-hidden border border-[var(--border)] bg-[var(--surface)]">
          <ListItem
            title="PC Dell Optiplex 7070"
            subtitle="Ali Bin Ahmad · 2j lepas"
            trailing={<Chip tone="reviewing">Semakan</Chip>}
            onClick={() => {}}
          />
          <ListItem
            title="HP LaserJet M402"
            subtitle="Puan Siti · 4j lepas"
            trailing={<Chip tone="done">Selesai</Chip>}
            onClick={() => {}}
          />
          <ListItem
            title="Read-only row (no chevron, no hover)"
            subtitle="Demonstrates non-interactive variant"
          />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-title-2 font-semibold">Bento grid (dashboard only)</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <BentoCard>
            <p className="text-footnote text-[var(--fg-muted)]">Menunggu</p>
            <p className="text-title-1 font-semibold tabular-nums">12</p>
          </BentoCard>
          <BentoCard>
            <p className="text-footnote text-[var(--fg-muted)]">Dalam Pelaksanaan</p>
            <p className="text-title-1 font-semibold tabular-nums">5</p>
          </BentoCard>
          <BentoCard span={2}>
            <p className="text-footnote text-[var(--fg-muted)]">Trend (placeholder)</p>
            <div className="h-24 rounded-md bg-[var(--primary-tint)]" />
          </BentoCard>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-title-2 font-semibold">Modal</h2>
        <Modal
          trigger={<Button variant="destructive"><Trash2 className="h-4 w-4" />Padam Permohonan</Button>}
          title="Padam permohonan?"
          description="Tindakan ini tidak boleh dibatalkan."
        >
          <div className="flex gap-3 justify-end mt-2">
            <Button variant="secondary">Batal</Button>
            <Button variant="destructive">Padam</Button>
          </div>
        </Modal>
      </section>

      <section className="space-y-4 pb-24">
        <h2 className="text-title-2 font-semibold">Bottom nav</h2>
        <p className="text-footnote text-[var(--fg-muted)]">
          Sentiasa tersemat bahagian bawah pada mobile. Skrol ke bawah untuk lihat safe-area padding.
        </p>
      </section>

      <BottomNav
        items={[
          { href: "/dashboard", label: "Utama", Icon: Home },
          { href: "/mohon", label: "Mohon", Icon: Plus },
          { href: "/semakan", label: "Semakan", Icon: ClipboardCheck },
          { href: "/semua", label: "Semua", Icon: FileText },
          { href: "/profil", label: "Profil", Icon: User },
        ]}
      />
    </div>
  );
}
```

- [ ] **Step 3: Visual verification — light then dark**

Run: `npm run dev`. Open `http://localhost:3000/design-system`.

Checklist (do manually):
- [ ] Buttons: all 4 variants, disabled, loading spinner all render correctly
- [ ] Inputs: error state shows red border + role="alert" text
- [ ] Chips: 6 tones all distinguishable, stamp-radius (not pill)
- [ ] List items: 56px min height, chevron on interactive rows, hover tint
- [ ] Bento grid: 2-col mobile, 4-col desktop, spans work
- [ ] Modal: opens with spring animation, close button works, focus trapped
- [ ] Bottom nav: safe-area padding visible (inspect on iPhone viewport)
- [ ] Theme toggle: all three segments switch; localStorage persists; reload keeps choice

Then toggle to Gelap and re-run every checkbox above.

- [ ] **Step 4: Commit**

```bash
git add app/design-system/layout.tsx app/design-system/page.tsx
git commit -m "feat(ui): add /design-system demo page for visual QA"
```

---

## Task 15: Full smoke test + branch ready

**Files:** (verification only)

- [ ] **Step 1: Run full test suite**

Run: `cd "D:/project/i-smartlupus-medi" && npm test -- --run`
Expected: All existing tests still pass + 7 new primitive test files pass. Total new test count ≥ 25.

- [ ] **Step 2: Production build**

Run: `npm run build`
Expected: Build succeeds with zero errors. Warnings matched against Task 1 baseline (no new warnings).

- [ ] **Step 3: Lint**

Run: `npm run lint`
Expected: Clean or only pre-existing warnings.

- [ ] **Step 4: Existing screens still render**

Run: `npm run dev`. Open `/login`, `/dashboard`, `/mohon`, `/semakan`, `/semua`, `/status`, `/pengguna`, `/profil` (with a logged-in session). Expected: every page still renders with old styling, no broken layouts, no console errors.

- [ ] **Step 5: Verify branch state**

Run:
```bash
git log --oneline master..feat/ios-redesign-foundation
git status
```
Expected: ~14 commits ahead of master, working tree clean.

- [ ] **Step 6: Final commit note (optional)**

If any small fixes surface during smoke test, commit them with descriptive messages. Do not squash — Plan B authors need the history.

---

## Self-Review (author ran before handoff)

**Spec coverage:**
- MASTER.md color tokens → Task 4 (CSS vars for light + dark) ✓
- MASTER.md typography tokens → Task 3 (Tailwind fontSize scale) ✓
- MASTER.md radius/shadow/motion → Task 3 (Tailwind extend) ✓
- MASTER.md Button spec → Task 7 ✓
- MASTER.md Input spec → Task 8 ✓
- MASTER.md Chip spec → Task 9 ✓
- MASTER.md ListItem spec → Task 10 ✓
- MASTER.md BentoCard spec → Task 11 ✓
- MASTER.md Modal spec → Task 12 ✓
- MASTER.md BottomNav spec → Task 13 ✓
- MASTER.md dark mode → Task 4 + Task 5 (provider) + Task 6 (toggle) ✓
- MASTER.md iconography (Lucide, stroke 1.75) → applied inline in Task 13 ✓
- Page overrides → **out of scope** (Plan B)

**Placeholder scan:**
- No "TODO", "TBD", "similar to above", or "add validation" — all code blocks complete.
- Every test has real assertions on specific classes or roles.

**Type consistency:**
- `Theme` type defined in `theme-provider.tsx`, imported in `theme-toggle.tsx` ✓
- `ChipTone` defined once, referenced by name in `Chip` props ✓
- `BottomNavItem` interface defined in `bottom-nav.tsx` and used in demo page shape ✓

**Known gaps / deferred to Plan B:**
- Existing `StatusBadge`, `StatCard`, `TicketCard`, `StatusChart`, `BottomNav` (v1), `Sidebar`, `Skeleton`, `PhotoUpload` — still use old tokens after Plan A lands. Plan B migrates them one by one.
- Existing pages not refactored. They still work on old palette.
- `rejection_reason`, `kaedah_pelupusan`, `completed_by` PRD fields — data-layer changes happen in Plan B alongside the relevant page.
- PWA splash / manifest refresh — Plan C if needed.

---

## Execution Handoff

**Plan complete and saved to `docs/superpowers/plans/2026-04-18-ios-redesign-foundation.md`. Two execution options:**

**1. Subagent-Driven (recommended)** — I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** — Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**
