# Plan B-2: Dashboard Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rewrite `app/(protected)/dashboard/page.tsx` to match the Bento Grid spec in `design-system/i-smartlupus-medi/pages/dashboard.md`, using Plan A primitives (`BentoCard`, `Stat`, `Avatar`, `ListItem`, `EmptyState`, `Chip`, `Button`) and the emerald palette. Existing data model (`disposal_tickets` + `profiles`) must keep working unchanged.

**Architecture:** The page becomes four visual zones stacked top-to-bottom: (1) greeting strip — flush title + muted date + Avatar, (2) a bento grid of 4 `Stat` cards sitting inside `BentoCard`s, (3) `StatusChart` retheme spanning 2 cols, (4) Recent tickets section using `ListItem` rows. A role-scoped floating "+ Mohon Baru" CTA hangs bottom-right for `user` role only. Legacy dashboard assets (`StatCard`, `StatusBadge` usage, old skeletons) are retired from this page but left in-repo for other pages until they migrate in Plans B-3 through B-8.

**Tech Stack:** Next.js 14 App Router (client component), Supabase for data (unchanged), Recharts for the existing bar chart (retheme only, API unchanged), Lucide icons, Vitest + RTL for unit + component tests.

**Out of scope:**
- Pages: mohon, semakan, semua, status, pengguna, profil (Plans B-3 through B-8)
- Pull-to-refresh PWA gesture (post-B-8 polish)
- "Tap stat card → filtered list" navigation — the destination pages aren't migrated yet, defer to B-3
- Replacing `StatusBadge` globally — we add a new `StatusChip` only for this page; other consumers keep using `StatusBadge` until their own Plan B-N
- Protected layout changes (Sidebar/old BottomNav swap — out of scope, possibly B-9)
- Role data model change (spec shows 4 roles `pemohon/penyemak/pelulus/pentadbir`; project has 3 `user/unit_aset/admin`) — we keep the 3-role data model, display Malay labels via existing `ROLE_LABELS`

---

## File Structure

**New files (created in this plan):**
- `lib/greeting.ts` — time-of-day greeting helper (Malay)
- `lib/greeting.test.ts` — tests for greeting
- `components/StatusChip.tsx` — emerald-aware status chip (wraps primitive `Chip` with `TicketStatus` mapping)
- `components/StatusChip.test.tsx` — tests for StatusChip

**Modified files:**
- `components/Skeleton.tsx` — rewrite `DashboardSkeleton` to bento-shape loader; keep `StatCardSkeleton`/`TicketCardSkeleton` for other pages
- `components/StatusChart.tsx` — retheme to CSS-var surface + theme-aware emerald palette; keep data API unchanged
- `app/(protected)/dashboard/page.tsx` — full rewrite: greeting strip, bento grid, recent tickets, role-scoped floating CTA

**Untouched (still uses old patterns until their own Plan B-N):**
- `components/StatCard.tsx` — consumed by pages not yet migrated; will be retired when last consumer migrates
- `components/StatusBadge.tsx` — same reason
- `components/TicketCard.tsx` — used by /semua, /status (will migrate in those plans)
- `components/Sidebar.tsx`, `components/BottomNav.tsx` (v1) — layout-level nav, out of scope
- `app/(protected)/layout.tsx` — unchanged

---

## Task 1: Verify baseline before touching code

**Files:** (git state only)

- [ ] **Step 1: Confirm clean working tree**

Run: `cd "D:/project/i-smartlupus-medi" && git status --short`
Expected: Clean or only `memory/` untracked (gitignored already).

- [ ] **Step 2: Confirm on foundation branch**

Run: `git branch --show-current`
Expected: `feat/ios-redesign-foundation`

- [ ] **Step 3: Baseline test count**

Run: `node -e "require('child_process').execSync('npm test -- --run', {stdio:'inherit', shell:process.env.COMSPEC})"`
Expected: `57 passed (57)` — baseline from end of Plan B-1.

- [ ] **Step 4: Dev server sanity check**

Run: `node -e "require('child_process').execSync('npm run dev', {stdio:'inherit', shell:process.env.COMSPEC})"` in a separate terminal.

Open http://localhost:3000/dashboard (log in first if needed).
Expected: Current dashboard renders with old `StatCard`s and horizontal `StatusChart`. Note the visual baseline — we'll compare after migration.

Leave dev server running for the rest of the plan.

---

## Task 2: Greeting utility

**Files:**
- Create: `lib/greeting.ts`
- Create: `lib/greeting.test.ts`

- [ ] **Step 1: Write the failing test**

Create `lib/greeting.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { getGreeting } from "./greeting";

describe("getGreeting", () => {
  it("returns 'Selamat pagi' before 12:00", () => {
    expect(getGreeting(new Date(2026, 3, 18, 5, 0))).toBe("Selamat pagi");
    expect(getGreeting(new Date(2026, 3, 18, 11, 59))).toBe("Selamat pagi");
  });

  it("returns 'Selamat tengah hari' between 12:00 and 14:59", () => {
    expect(getGreeting(new Date(2026, 3, 18, 12, 0))).toBe("Selamat tengah hari");
    expect(getGreeting(new Date(2026, 3, 18, 14, 59))).toBe("Selamat tengah hari");
  });

  it("returns 'Selamat petang' between 15:00 and 18:59", () => {
    expect(getGreeting(new Date(2026, 3, 18, 15, 0))).toBe("Selamat petang");
    expect(getGreeting(new Date(2026, 3, 18, 18, 59))).toBe("Selamat petang");
  });

  it("returns 'Selamat malam' from 19:00 onwards and before 5:00", () => {
    expect(getGreeting(new Date(2026, 3, 18, 19, 0))).toBe("Selamat malam");
    expect(getGreeting(new Date(2026, 3, 18, 23, 59))).toBe("Selamat malam");
    expect(getGreeting(new Date(2026, 3, 18, 0, 0))).toBe("Selamat malam");
    expect(getGreeting(new Date(2026, 3, 18, 4, 59))).toBe("Selamat malam");
  });

  it("defaults to current time when no arg provided", () => {
    const result = getGreeting();
    expect([
      "Selamat pagi",
      "Selamat tengah hari",
      "Selamat petang",
      "Selamat malam",
    ]).toContain(result);
  });
});
```

- [ ] **Step 2: Run test — expect FAIL**

Run: `node -e "require('child_process').execSync('npm test -- --run lib/greeting.test.ts', {stdio:'inherit', shell:process.env.COMSPEC})"`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement helper**

Create `lib/greeting.ts`:

```ts
/**
 * Malay time-of-day greeting. Buckets:
 *   05:00-11:59 → Selamat pagi
 *   12:00-14:59 → Selamat tengah hari
 *   15:00-18:59 → Selamat petang
 *   19:00-04:59 → Selamat malam
 */
export function getGreeting(now: Date = new Date()): string {
  const h = now.getHours();
  if (h >= 5 && h < 12) return "Selamat pagi";
  if (h >= 12 && h < 15) return "Selamat tengah hari";
  if (h >= 15 && h < 19) return "Selamat petang";
  return "Selamat malam";
}
```

- [ ] **Step 4: Run test — expect PASS**

Run: `node -e "require('child_process').execSync('npm test -- --run lib/greeting.test.ts', {stdio:'inherit', shell:process.env.COMSPEC})"`
Expected: all 5 tests pass.

- [ ] **Step 5: Commit**

```bash
git add lib/greeting.ts lib/greeting.test.ts
git commit -m "feat(dashboard): add Malay time-of-day greeting helper"
```

---

## Task 3: StatusChip component

**Files:**
- Create: `components/StatusChip.tsx`
- Create: `components/StatusChip.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `components/StatusChip.test.tsx`:

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { StatusChip } from "./StatusChip";

describe("StatusChip", () => {
  it("renders Malay label for each status", () => {
    const cases = [
      { status: "BARU", label: "Baru" },
      { status: "menunggu_semakan", label: "Menunggu Semakan" },
      { status: "proses_pelupusan", label: "Proses Pelupusan" },
      { status: "selesai", label: "Selesai" },
      { status: "ditolak", label: "Ditolak" },
    ] as const;

    for (const { status, label } of cases) {
      const { unmount } = render(<StatusChip status={status} />);
      expect(screen.getByText(label)).toBeInTheDocument();
      unmount();
    }
  });

  it("applies 'done' tone for selesai (emerald progression deepest)", () => {
    render(<StatusChip status="selesai" />);
    const chip = screen.getByText("Selesai");
    expect(chip.className).toMatch(/chip-done/);
  });

  it("applies 'rejected' tone for ditolak", () => {
    render(<StatusChip status="ditolak" />);
    const chip = screen.getByText("Ditolak");
    expect(chip.className).toMatch(/chip-rejected/);
  });
});
```

- [ ] **Step 2: Run test — expect FAIL**

Run: `node -e "require('child_process').execSync('npm test -- --run components/StatusChip.test.tsx', {stdio:'inherit', shell:process.env.COMSPEC})"`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement StatusChip**

Create `components/StatusChip.tsx`:

```tsx
import { Chip, type ChipTone } from "@/components/ui/chip";
import type { TicketStatus } from "@/lib/supabase/types";

const toneMap: Record<TicketStatus, ChipTone> = {
  BARU: "neutral",
  menunggu_semakan: "pending",
  proses_pelupusan: "executing",
  selesai: "done",
  ditolak: "rejected",
};

const labelMap: Record<TicketStatus, string> = {
  BARU: "Baru",
  menunggu_semakan: "Menunggu Semakan",
  proses_pelupusan: "Proses Pelupusan",
  selesai: "Selesai",
  ditolak: "Ditolak",
};

interface StatusChipProps {
  status: TicketStatus;
  className?: string;
}

export function StatusChip({ status, className }: StatusChipProps) {
  return (
    <Chip tone={toneMap[status]} className={className}>
      {labelMap[status]}
    </Chip>
  );
}
```

- [ ] **Step 4: Run test — expect PASS**

Run: `node -e "require('child_process').execSync('npm test -- --run components/StatusChip.test.tsx', {stdio:'inherit', shell:process.env.COMSPEC})"`
Expected: all 3 tests pass.

- [ ] **Step 5: Commit**

```bash
git add components/StatusChip.tsx components/StatusChip.test.tsx
git commit -m "feat(dashboard): add StatusChip wrapping primitive Chip with TicketStatus mapping"
```

---

## Task 4: Retheme StatusChart to emerald palette

> The existing component already accepts `ChartData[]` where each item carries its own color. We keep the API but (a) swap the surface styling to CSS vars so it blends into the bento grid, (b) update `color` values at the call site in Task 7 to emerald-aware Tailwind hex. This task is visual-only on the component itself.

**Files:**
- Modify: `components/StatusChart.tsx`

- [ ] **Step 1: Update StatusChart to use CSS var surface + neutral tick/grid colors**

Replace `components/StatusChart.tsx` entirely with:

```tsx
"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface ChartData {
  name: string;
  value: number;
  color: string;
}

interface StatusChartProps {
  data: ChartData[];
  title?: string;
  subtitle?: string;
}

export default function StatusChart({
  data,
  title = "Taburan Status",
  subtitle = "Ringkasan tiket pelupusan aset",
}: StatusChartProps) {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-subhead font-semibold text-[var(--fg)]">{title}</h2>
        <p className="text-footnote text-[var(--fg-muted)] mt-0.5">{subtitle}</p>
      </div>

      <div className="h-[200px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
            <XAxis type="number" hide />
            <YAxis
              dataKey="name"
              type="category"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "currentColor", fontSize: 12, fontWeight: 500 }}
              width={110}
              className="text-[var(--fg-muted)]"
            />
            <Tooltip
              cursor={{ fill: "var(--primary-tint)" }}
              contentStyle={{
                borderRadius: "8px",
                border: "1px solid var(--border)",
                background: "var(--surface-elevated)",
                color: "var(--fg)",
                fontWeight: 500,
                fontSize: "12px",
              }}
            />
            <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
```

Key changes vs old version:
- Removed outer wrapper `div` that had its own `bg-white rounded-xl border` — this component now assumes it sits **inside** a `BentoCard` (Task 7), so it has no own surface
- Title/subtitle use design tokens (`text-subhead`/`text-footnote` + `--fg`/`--fg-muted`)
- Tooltip uses CSS vars — works in both light and dark mode
- Tick font weight dropped from 800 to 500 (matches iOS restraint)

- [ ] **Step 2: Run existing StatusChart test to confirm non-breaking**

Run: `node -e "require('child_process').execSync('npm test -- --run components/StatusChart.test.tsx', {stdio:'inherit', shell:process.env.COMSPEC})"`
Expected: all existing tests pass (we changed visual styling only, not data API).

If any test asserts the removed wrapper classes (`bg-white`, `rounded-xl`, etc), update those assertions to match the new structure. The test file likely only asserts data rendering — open it first to confirm scope of edits needed.

- [ ] **Step 3: Commit**

```bash
git add components/StatusChart.tsx components/StatusChart.test.tsx
git commit -m "refactor(chart): retheme StatusChart to CSS vars, remove own surface (sits in BentoCard)"
```

---

## Task 5: Rewrite DashboardSkeleton to bento shape

**Files:**
- Modify: `components/Skeleton.tsx`

- [ ] **Step 1: Update DashboardSkeleton only (keep StatCardSkeleton + TicketCardSkeleton intact for other pages)**

In `components/Skeleton.tsx`, find the existing `DashboardSkeleton` function and replace ONLY that function (leave `StatCardSkeleton`, `TicketCardSkeleton`, `SkeletonPulse`, `TicketListSkeleton` untouched) with:

```tsx
/** Skeleton for a single bento-shape stat card */
function BentoStatSkeleton() {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
      <div className="space-y-3">
        <SkeletonPulse className="h-3 w-20" />
        <SkeletonPulse className="h-7 w-14" />
      </div>
    </div>
  );
}

/** Skeleton for the chart bento tile */
function BentoChartSkeleton() {
  return (
    <div className="col-span-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
      <div className="space-y-3">
        <SkeletonPulse className="h-4 w-32" />
        <SkeletonPulse className="h-3 w-48" />
        <SkeletonPulse className="h-[180px] w-full" />
      </div>
    </div>
  );
}

/** Skeleton for the dashboard page */
export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Greeting strip */}
      <div className="space-y-2">
        <SkeletonPulse className="h-8 w-64" />
        <SkeletonPulse className="h-4 w-40" />
      </div>

      {/* Bento grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <BentoStatSkeleton />
        <BentoStatSkeleton />
        <BentoStatSkeleton />
        <BentoStatSkeleton />
        <BentoChartSkeleton />
      </div>

      {/* Recent tickets */}
      <div className="space-y-3">
        <SkeletonPulse className="h-4 w-32" />
        <TicketCardSkeleton />
        <TicketCardSkeleton />
        <TicketCardSkeleton />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Run test suite — expect PASS**

Run: `node -e "require('child_process').execSync('npm test -- --run', {stdio:'inherit', shell:process.env.COMSPEC})"`
Expected: all tests pass. `Skeleton` has no dedicated test file to update; other pages using `StatCardSkeleton` / `TicketCardSkeleton` are unaffected.

- [ ] **Step 3: Commit**

```bash
git add components/Skeleton.tsx
git commit -m "refactor(skeleton): rewrite DashboardSkeleton to bento shape using CSS vars"
```

---

## Task 6: Dashboard page scaffold — greeting strip + loading state

> Replace the whole dashboard page with the new structure. In this task we wire the greeting strip + loading state using the new skeleton. Stats + chart + recent tickets come in Tasks 7, 8, 9.

**Files:**
- Modify: `app/(protected)/dashboard/page.tsx`

- [ ] **Step 1: Replace page with scaffold**

Replace `app/(protected)/dashboard/page.tsx` entirely with:

```tsx
"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { DisposalTicket, Profile, TicketStatus } from "@/lib/supabase/types";
import { ROLE_LABELS } from "@/lib/constants";
import { DashboardSkeleton } from "@/components/Skeleton";
import { Avatar } from "@/components/ui/avatar";
import { Chip } from "@/components/ui/chip";
import { getGreeting } from "@/lib/greeting";

type Role = Profile["role"];

function avatarRole(role: Role): "pemohon" | "penyemak" | "pentadbir" {
  if (role === "user") return "pemohon";
  if (role === "unit_aset") return "penyemak";
  return "pentadbir";
}

function formatTodayMY(d: Date = new Date()): string {
  // 18 Apr 2026 style — Intl with ms-MY locale
  return new Intl.DateTimeFormat("ms-MY", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(d);
}

interface Counts {
  total: number;
  menunggu_semakan: number;
  proses_pelupusan: number;
  selesai: number;
  ditolak: number;
}

const emptyCounts: Counts = {
  total: 0,
  menunggu_semakan: 0,
  proses_pelupusan: 0,
  selesai: 0,
  ditolak: 0,
};

export default function DashboardPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [counts, setCounts] = useState<Counts>(emptyCounts);
  const [recent, setRecent] = useState<DisposalTicket[]>([]);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: prof } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (!prof) return;
      setProfile(prof as Profile);

      // Counts
      const statusQuery = supabase.from("disposal_tickets").select("status");
      const { data: statusRows } = prof.role === "user"
        ? await statusQuery.eq("created_by", user.id)
        : await statusQuery;

      const rows = statusRows ?? [];
      const count = (s: TicketStatus) => rows.filter((t) => t.status === s).length;
      setCounts({
        total: rows.length,
        menunggu_semakan: count("menunggu_semakan"),
        proses_pelupusan: count("proses_pelupusan"),
        selesai: count("selesai"),
        ditolak: count("ditolak"),
      });

      // Recent tickets — last 5
      const recentQuery = supabase
        .from("disposal_tickets")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5);
      const { data: recentRows } = prof.role === "user"
        ? await recentQuery.eq("created_by", user.id)
        : await recentQuery;
      setRecent((recentRows ?? []) as DisposalTicket[]);
    }
    load();
  }, []);

  if (!profile) {
    return (
      <div role="status">
        <DashboardSkeleton />
        <span className="sr-only">Memuatkan papan pemuka...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Greeting strip — flush, not a card */}
      <header className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-title-1 font-semibold text-[var(--fg)] tracking-tight">
            {getGreeting()}, {profile.full_name.split(" ")[0]}
          </h1>
          <div className="mt-1.5 flex items-center gap-2 text-footnote text-[var(--fg-muted)]">
            <span>{formatTodayMY()}</span>
            <span aria-hidden>·</span>
            <Chip tone="neutral">{ROLE_LABELS[profile.role]}</Chip>
          </div>
        </div>
        <Avatar name={profile.full_name} role={avatarRole(profile.role)} size="lg" />
      </header>

      {/* Bento grid + recent tickets land in Tasks 7, 8, 9 */}
      <div data-testid="dashboard-body" />

      {/* Floating CTA lands in Task 10 */}
    </div>
  );
}
```

- [ ] **Step 2: Manual verification in dev**

Refresh http://localhost:3000/dashboard.

Checklist:
- [ ] Greeting reads "Selamat [pagi/tengah hari/petang/malam], {first name}" matching real current time
- [ ] Date shows in Malay format (e.g. `18 April 2026`)
- [ ] Role chip shows Malay label (`Pengguna` / `Unit Aset` / `Pentadbir`)
- [ ] Avatar shows user's initials, with role-colored background
- [ ] No stats / chart / list yet — that's expected (tasks 7-9)
- [ ] Skeleton flashes briefly on load, then content appears
- [ ] Both light and dark mode render the greeting strip cleanly (toggle via `/profil` or devtools `document.documentElement.classList.toggle('dark')`)

- [ ] **Step 3: Commit**

```bash
git add app/\(protected\)/dashboard/page.tsx
git commit -m "feat(dashboard): scaffold new iOS-style dashboard with greeting strip + loading state"
```

---

## Task 7: Stat Bento grid

**Files:**
- Modify: `app/(protected)/dashboard/page.tsx`

- [ ] **Step 1: Add imports and stat definitions**

In `app/(protected)/dashboard/page.tsx`, add to the top-level imports:

```tsx
import { BentoCard } from "@/components/ui/bento-card";
import { Stat } from "@/components/ui/stat";
import { ClipboardList, Clock, RefreshCw, CheckCircle2 } from "lucide-react";
```

Add a `roleStatLabels` helper above the component (below the `emptyCounts` constant):

```tsx
// Role-aware stat labels per dashboard spec §Role variants.
// Project has 3 roles; spec's 4 roles compressed to fit data model.
function statLabels(role: Role): { total: string; pending: string; executing: string; done: string } {
  if (role === "user") {
    return {
      total: "Permohonan Saya",
      pending: "Menunggu Semakan",
      executing: "Dalam Pelaksanaan",
      done: "Selesai",
    };
  }
  // unit_aset + admin see aggregate view
  return {
    total: "Jumlah Permohonan",
    pending: "Menunggu Semakan",
    executing: "Dalam Pelaksanaan",
    done: "Selesai",
  };
}
```

- [ ] **Step 2: Render the bento stats grid**

Replace the placeholder `<div data-testid="dashboard-body" />` inside the returned JSX with the stats grid:

```tsx
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <BentoCard>
          <div className="flex items-start justify-between">
            <ClipboardList className="h-5 w-5 text-[var(--fg-muted)]" aria-hidden />
          </div>
          <div className="mt-3">
            <Stat label={statLabels(profile.role).total} value={counts.total} />
          </div>
        </BentoCard>

        <BentoCard>
          <div className="flex items-start justify-between">
            <Clock className="h-5 w-5 text-[var(--chip-pending-fg)]" aria-hidden />
          </div>
          <div className="mt-3">
            <Stat label={statLabels(profile.role).pending} value={counts.menunggu_semakan} />
          </div>
        </BentoCard>

        <BentoCard>
          <div className="flex items-start justify-between">
            <RefreshCw className="h-5 w-5 text-[var(--chip-executing-fg)]" aria-hidden />
          </div>
          <div className="mt-3">
            <Stat label={statLabels(profile.role).executing} value={counts.proses_pelupusan} />
          </div>
        </BentoCard>

        <BentoCard>
          <div className="flex items-start justify-between">
            <CheckCircle2 className="h-5 w-5 text-[var(--chip-done-fg)]" aria-hidden />
          </div>
          <div className="mt-3">
            <Stat label={statLabels(profile.role).done} value={counts.selesai} />
          </div>
        </BentoCard>
      </div>
```

(The chart + recent tickets go below this grid in the next tasks. For now, after this grid we still have nothing else rendering — that's fine.)

- [ ] **Step 3: Manual verification**

Refresh dashboard.

Checklist:
- [ ] 4 bento cards render: Total, Menunggu Semakan, Dalam Pelaksanaan, Selesai
- [ ] Mobile (narrow viewport): 2×2 grid
- [ ] Tablet+ (>768px): 1×4 grid
- [ ] Each card has an icon top-left, tinted (muted slate for total, emerald progression for others)
- [ ] Numbers use tabular-nums (no jitter if one value changes)
- [ ] Emerald gradient stripe at top of each BentoCard visible
- [ ] Hover: slight lift + border darken
- [ ] Labels match role (user sees "Permohonan Saya", unit_aset/admin see "Jumlah Permohonan")
- [ ] Dark mode: dark cards with emerald gradient + readable numbers

- [ ] **Step 4: Commit**

```bash
git add app/\(protected\)/dashboard/page.tsx
git commit -m "feat(dashboard): add bento stat grid with role-aware labels and emerald icon accents"
```

---

## Task 8: Wire StatusChart into bento grid (col-span-2)

**Files:**
- Modify: `app/(protected)/dashboard/page.tsx`

- [ ] **Step 1: Add chart import + theme hook + color helper**

In `app/(protected)/dashboard/page.tsx`, add to imports:

```tsx
import StatusChart from "@/components/StatusChart";
import { useTheme } from "@/components/theme-provider";
```

Add a chart-color helper above the component (below `statLabels`):

```tsx
// Tailwind 500-level for light, 400-level for dark — consistent with emerald brand.
function chartColors(mode: "light" | "dark") {
  if (mode === "dark") {
    return {
      menunggu: "#facc15", // yellow-400
      proses:   "#fb923c", // orange-400
      selesai:  "#34d399", // emerald-400
      ditolak:  "#f87171", // red-400
    };
  }
  return {
    menunggu: "#eab308", // yellow-500
    proses:   "#f97316", // orange-500
    selesai:  "#10b981", // emerald-500 (was green-500)
    ditolak:  "#ef4444", // red-500
  };
}
```

- [ ] **Step 2: Use theme hook + build chart data inside component**

Inside `DashboardPage`, above the `if (!profile)` return, add:

```tsx
  const { resolvedTheme } = useTheme();
  const palette = chartColors(resolvedTheme);
  const chartData = [
    { name: "Menunggu", value: counts.menunggu_semakan, color: palette.menunggu },
    { name: "Proses",   value: counts.proses_pelupusan, color: palette.proses },
    { name: "Selesai",  value: counts.selesai,          color: palette.selesai },
    { name: "Ditolak",  value: counts.ditolak,          color: palette.ditolak },
  ];
```

- [ ] **Step 3: Render StatusChart inside a BentoCard with span=2, appended to the grid**

Inside the returned JSX, inside the same `<div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">`, after the 4 stat cards, add:

```tsx
        <BentoCard span={2} className="md:col-span-4">
          <StatusChart data={chartData} />
        </BentoCard>
```

Note: `span={2}` makes mobile (2-col) layout span full width; `md:col-span-4` makes tablet+ (4-col) also span full width.

- [ ] **Step 4: Manual verification**

Refresh dashboard.

Checklist:
- [ ] Chart appears below the 4 stat cards
- [ ] Chart spans full width on both mobile and tablet
- [ ] Bars colored: yellow (Menunggu), orange (Proses), emerald (Selesai), red (Ditolak)
- [ ] Title "Taburan Status" visible with muted subtitle
- [ ] Hover on bars shows tooltip with surface color + emerald tint on cursor
- [ ] Dark mode: bars in lighter 400-level colors, tooltip dark with emerald hints
- [ ] Chart sits inside a BentoCard — same top emerald gradient stripe, same border, same hover lift

- [ ] **Step 5: Commit**

```bash
git add app/\(protected\)/dashboard/page.tsx
git commit -m "feat(dashboard): embed StatusChart in full-width BentoCard with theme-aware emerald palette"
```

---

## Task 9: Recent tickets section

**Files:**
- Modify: `app/(protected)/dashboard/page.tsx`

- [ ] **Step 1: Add imports**

In `app/(protected)/dashboard/page.tsx`, add to imports:

```tsx
import Link from "next/link";
import { ListItem } from "@/components/ui/list-item";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusChip } from "@/components/StatusChip";
import { formatDate } from "@/lib/utils";
import { Inbox } from "lucide-react";
import { useRouter } from "next/navigation";
```

Add `const router = useRouter();` at the top of `DashboardPage`, next to the other hooks.

- [ ] **Step 2: Render recent tickets section below the grid**

Inside the returned JSX, after the closing `</div>` of the bento grid, add:

```tsx
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-subhead font-semibold text-[var(--fg)]">Terkini</h2>
          <Link
            href="/semua"
            className="text-footnote font-medium text-[var(--primary)] hover:underline"
          >
            Lihat semua →
          </Link>
        </div>

        {recent.length === 0 ? (
          <EmptyState
            icon={<Inbox className="h-8 w-8" aria-hidden />}
            title="Belum ada permohonan"
            description={
              profile.role === "user"
                ? "Mohon pelupusan pertama anda untuk mula."
                : "Tiada tiket setakat ini."
            }
          />
        ) : (
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
            {recent.map((t) => (
              <ListItem
                key={t.id}
                onClick={() => router.push(`/semua/${t.id}`)}
                title={
                  <span className="flex items-center gap-2">
                    <span className="text-caption font-semibold text-[var(--primary)] uppercase tracking-wide">
                      {t.ticket_no}
                    </span>
                    <StatusChip status={t.status} />
                  </span>
                }
                subtitle={
                  <span className="flex items-center gap-1.5">
                    <span className="truncate">{t.asset_name}</span>
                    <span aria-hidden className="text-[var(--border-strong)]">·</span>
                    <span>{formatDate(t.created_at)}</span>
                  </span>
                }
              />
            ))}
          </div>
        )}
      </section>
```

- [ ] **Step 3: Quickly check EmptyState API**

Run: `Grep` (or open) `D:/project/i-smartlupus-medi/components/ui/empty-state.tsx` and confirm props match `{ icon?, title, description?, action? }`. If props differ, adjust the call above to match.

- [ ] **Step 4: Manual verification**

Refresh dashboard.

Checklist:
- [ ] "Terkini" section header visible, right-aligned "Lihat semua →" emerald link
- [ ] Up to 5 recent tickets render as flat list rows inside a bordered container
- [ ] Each row: ticket_no in emerald caps + StatusChip inline with it
- [ ] Subtitle: asset name + middle-dot + formatted date
- [ ] Click a row → navigates to `/semua/{id}` (may 404 if page not migrated; that's fine for now — just confirm URL changes)
- [ ] If no tickets: EmptyState shows Inbox icon + "Belum ada permohonan" + role-aware description
- [ ] Dark mode: list container dark surface, StatusChips use emerald-glow dark tones
- [ ] Active tap: brief emerald tint on row (from ListItem primitive)

- [ ] **Step 5: Commit**

```bash
git add app/\(protected\)/dashboard/page.tsx
git commit -m "feat(dashboard): add recent tickets section with ListItem rows and empty-state fallback"
```

---

## Task 10: Floating "+ Mohon Baru" CTA (pemohon/user role only)

**Files:**
- Modify: `app/(protected)/dashboard/page.tsx`

- [ ] **Step 1: Add imports**

In `app/(protected)/dashboard/page.tsx`, add to imports:

```tsx
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
```

- [ ] **Step 2: Render the floating CTA**

At the very bottom of the returned JSX (just before the outermost closing `</div>`), add:

```tsx
      {profile.role === "user" && (
        <Link
          href="/mohon"
          className="fixed right-4 bottom-24 md:bottom-8 md:right-8 z-40"
          aria-label="Mohon baru"
        >
          <Button size="lg" className="shadow-lg rounded-full px-5 gap-2">
            <Plus className="h-5 w-5" aria-hidden />
            Mohon Baru
          </Button>
        </Link>
      )}
```

Notes on positioning:
- `bottom-24` on mobile clears the bottom nav (~64px) + margin
- `md:bottom-8` on tablet+ since bottom nav hides on md+ (sidebar shows instead)
- `z-40` sits above bento content but below modals

- [ ] **Step 3: Manual verification**

Refresh dashboard as a **user-role** account.

Checklist:
- [ ] Floating emerald pill button with `+ Mohon Baru` visible bottom-right
- [ ] Sits above the bottom nav (doesn't overlap nav items)
- [ ] Shadow-lg visible against the surface
- [ ] Click → navigates to `/mohon` (page may still use old style; that's fine)
- [ ] On tablet+ viewport: button stays bottom-right, no overlap with sidebar
- [ ] Dark mode: emerald-400 button with emerald-950 text visible

Then log in as **unit_aset** or **admin** role:
- [ ] Floating CTA is **NOT** visible

- [ ] **Step 4: Commit**

```bash
git add app/\(protected\)/dashboard/page.tsx
git commit -m "feat(dashboard): add floating + Mohon Baru CTA for pemohon role only"
```

---

## Task 11: Dark mode verification pass

**Files:** (visual verification + CSS fix if needed)

- [ ] **Step 1: Force dark mode**

With dev running + logged in, open dashboard. In browser DevTools console:

```js
document.documentElement.classList.add("dark"); localStorage.setItem("theme", "dark");
```

Refresh.

- [ ] **Step 2: Dark mode checklist**

- [ ] Page background dark slate (`--bg`)
- [ ] Greeting heading readable (near-white)
- [ ] Date + middle-dot visible in muted slate
- [ ] Role chip neutral tone readable
- [ ] Avatar role-colored bg visible (emerald for admin, blue for unit_aset)
- [ ] 4 bento stat cards: dark surface, emerald gradient stripe top, readable numbers
- [ ] Icon accents visible: slate (total), yellow (pending), emerald (executing), emerald (done)
- [ ] Chart bento: dark surface, bars in 400-level colors, tooltip dark
- [ ] Recent tickets container: dark bordered surface, ticket_no in emerald, StatusChip tones visible, dividers between rows
- [ ] EmptyState (if no data): icon + text readable on dark
- [ ] Floating CTA: emerald-400 pill with emerald-950 text, shadow visible
- [ ] No "ghost white" flashes of light-mode fragments

- [ ] **Step 3: If any fail, fix and commit**

If any visual fails the checklist, fix it in-place and commit with a clear message (e.g. `fix(dashboard): raise bento surface contrast in dark mode`). If all pass, skip.

- [ ] **Step 4: Reset to light mode**

```js
document.documentElement.classList.remove("dark"); localStorage.setItem("theme", "light");
```

Refresh. Verify light mode still looks clean.

---

## Task 12: Full smoke test + branch summary

**Files:** (verification only)

- [ ] **Step 1: Full test suite**

Run: `node -e "require('child_process').execSync('npm test -- --run', {stdio:'inherit', shell:process.env.COMSPEC})"`

Expected: All previous tests still pass + 5 new greeting tests + 3 new StatusChip tests. Total `65 passed (65)` (was 57 at start of Plan B-2).

- [ ] **Step 2: Production build**

Run: `node -e "require('child_process').execSync('npm run build', {stdio:'inherit', shell:process.env.COMSPEC})"`

Expected: Build succeeds. `/dashboard` route size should change modestly (bundle includes BentoCard/Stat/Avatar/ListItem/EmptyState/StatusChip — more primitives, but old StatCard dropped).

- [ ] **Step 3: Lint**

Run: `node -e "require('child_process').execSync('npm run lint', {stdio:'inherit', shell:process.env.COMSPEC})"`

Expected: Clean or only pre-existing warnings (compare against Plan B-1 baseline).

- [ ] **Step 4: Other pages still render (no regressions)**

With dev server running and logged in, visit each protected route and confirm no console errors + visual shape unchanged:

- [ ] `/mohon` — still uses old pattern, should render
- [ ] `/semakan` — same
- [ ] `/semua` — same (still uses old `TicketCard` + `StatusBadge`)
- [ ] `/status` — same
- [ ] `/pengguna` — same
- [ ] `/profil` — same
- [ ] `/login` (after log out) — Plan B-1 work intact

Any regression means something shared got touched unintentionally. Most likely culprit would be `Skeleton.tsx` — our `DashboardSkeleton` rewrite should NOT have affected `StatCardSkeleton`/`TicketCardSkeleton` (both still exported unchanged).

- [ ] **Step 5: Branch state**

Run:
```bash
git log --oneline master..HEAD | head -15
git status
```

Expected: ~10 new commits since the last Plan B-1 commit (`f7858c8`), working tree clean. Total commits ahead of master ≈ 34.

---

## Self-Review (author ran before handoff)

**Spec coverage** against `design-system/i-smartlupus-medi/pages/dashboard.md`:
- ✅ Greeting strip with title-1 + subhead muted (date + role chip), flush against grid → Task 6
- ✅ Stat Bento: 4 cards per spec → Task 7 (compressed from 5 project statuses to 4 spec tiles; `ditolak` absorbed into chart — see Known gaps)
- ✅ Each stat: icon top-left (Lucide 20px, tinted by state), number title-1 tabular, label footnote muted → Task 7 (Stat primitive + tokens)
- ✅ Mobile 2×2, tablet 1×4 → Task 7 (`grid-cols-2 md:grid-cols-4`)
- ✅ StatusChart spans col-span-2 both breakpoints → Task 8 (`span={2} md:col-span-4`)
- ✅ Recent tickets: last 5, flat list items (not bento), "Terkini" + "Lihat semua →" → Task 9
- ✅ Primary action (pemohon only) floating bottom-right → Task 10 (role === "user" gate)
- ✅ Bento `shadow-sm` + `border`, hover lift `-1px` to `shadow-md` → BentoCard primitive already implements this
- ✅ Tabular-nums on numbers → Stat primitive already uses `tabular-nums`
- ✅ Loading: skeleton blocks per bento slot → Task 5 + Task 6 (no spinner, shaped skeletons)
- ✅ Empty state: warm illustration + CTA → Task 9 (EmptyState primitive, Inbox icon, role-aware description)
- ✅ Dark mode parity → Task 11 verification

**Placeholder scan:** Searched for "TBD", "TODO", "implement later", "similar to" — none present. All code blocks complete.

**Type consistency:**
- `getGreeting(now?: Date) => string` defined Task 2, called in Task 6 ✓
- `StatusChip` props `{ status: TicketStatus, className?: string }` defined Task 3, used Task 9 ✓
- `avatarRole(role: Profile["role"])` returns `"pemohon" | "penyemak" | "pentadbir"` — matches `Avatar`'s `role` prop type (which accepts `"pemohon" | "penyemak" | "pelulus" | "pentadbir"` — we never emit `"pelulus"` because data model lacks it) ✓
- `BentoCard` `span` prop: `1 | 2` — used with `2` in Task 8, combined with `md:col-span-4` className override for tablet behavior ✓
- `Stat` props `{ label, value, delta?, trend?, className? }` — Task 7 only uses label + value, OK ✓
- `ListItem` props `{ leading?, title, subtitle?, trailing?, onClick?, showChevron? }` — Task 9 uses title + subtitle + onClick, showChevron defaults true ✓
- `EmptyState` — Task 9 Step 3 explicitly verifies API before calling; adjust if props differ ✓
- `useTheme` returns `{ theme, resolvedTheme, setTheme }` — Task 8 uses `resolvedTheme: "light" | "dark"` ✓
- `ROLE_LABELS` from `lib/constants` — existing, reused ✓
- `formatDate` from `lib/utils` — existing utility used by `TicketCard`, reused ✓

**Known gaps (tracked separately):**
- Spec shows 4 roles (pemohon/penyemak/pelulus/pentadbir); project has 3 (user/unit_aset/admin). Plan compresses display accordingly — data model stays. Post-B-8 candidate: propose schema expansion (or accept 3-role simplification as final).
- `ditolak` count has no dedicated bento card (spec shows 4 positive-flow tiles). It's visible in the chart instead. Acceptable per spec — stat cards are positive-flow indicators, chart is the full distribution.
- "Tap stat card → filtered list" interaction deferred — destination pages not migrated yet. Wiring deferred to Plan B-3 (+ related page plans).
- Pull-to-refresh: PWA-native gesture, post-B-8 polish.

---

## Execution Handoff

**Plan complete and saved to `docs/superpowers/plans/2026-04-18-plan-b2-dashboard-migration.md`. Two execution options:**

**1. Subagent-Driven (recommended)** — I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** — Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**
