# Pemohon (User Role) Analyst Dashboard — Design

**Date**: 2026-05-28
**Status**: Approved — ready for implementation plan
**Scope**: Replace the legacy stat-card dashboard for `profile.role === "user"` with an analyst-style dashboard mirroring the unit_aset shape, reshaped for the requester perspective.

---

## 1. Problem & Goal

The unit_aset role got a full analyst dashboard yesterday (2026-05-27): 5 KPIs + 7 widgets, parallel-query data layer, client-side aggregation, role-based routing. The pemohon (user) role still sees the legacy stat-card layout — 4 simple counts + StatusChart donut + recent-tickets list — which is structurally inconsistent with the new unit_aset visual language.

**Goal**: deliver visual + structural parity for the user role. 4 KPI cards + 6 widgets, shaped around what a requester actually needs to know about *their own* tickets.

**Non-goals**:
- Building a ticket edit / resubmit flow for rejected tickets (separate feature)
- Admin dashboard (next item in the queue, but out of scope here)
- Refactoring unit_aset's data layer (only minimal shared-type extraction)
- E2E spec additions (manual smoke is sufficient per current convention)

---

## 2. Dashboard Shape — Decision Locked

**Picked**: full analytic shape (matches unit_aset). 4 KPIs + 6 widgets.

**Rejected**: action-oriented shape (smaller scope, less analytic) and hybrid (more widgets but YAGNI).

**Acknowledged trade-off**: a pemohon may have only a handful of tickets, so charts can render sparse. Handled per §6 (Error handling & edge cases) — every widget has an EmptyState path, and the whole-dashboard zero state shows a Welcome panel with a "Mohon Baru" CTA instead of empty charts.

---

## 3. Widget Set

### KPI strip (4 cards, `grid-cols-2 md:grid-cols-4`)

| # | Label (Malay) | Meaning | Tone | Good direction |
|---|---|---|---|---|
| 1 | Permohonan Aktif | My tickets in `menunggu_semakan` + `proses_pelupusan` (snapshot, no delta) | emerald | — |
| 2 | Diluluskan (30h) | My tickets approved (reviewed_at, status != ditolak) last 30d; pctChange vs prior 30d + sparkline | amber | up |
| 3 | Median Masa Kelulusan | Median `reviewed_at - created_at` hours; delta vs prior 30d | sky | down |
| 4 | Kadar Kelulusan | (reviewed - rejected) / reviewed, last 30d; delta vs prior 30d | violet | up |

### Widgets (6, 2-column layout md+)

| # | Title (Malay) | Component | Source |
|---|---|---|---|
| 1 | Aliran Permohonan Saya | `DualLineChart` | Reuse — relabel "intake"→hantar, "reviewed"→selesai |
| 2 | Status Permohonan | `StatusChart` | Reuse existing legacy donut (4 statuses) |
| 3 | Taburan Masa Kelulusan | `DurationHistogram` | Reuse |
| 4 | Kategori Aset Saya | `NestedDonut` | Reuse — feed with my-tickets CategoryMix |
| 5 | Permohonan Memerlukan Perhatian | `AttentionTable` | **New** (see §5.2) |
| 6 | Aktiviti Terkini Saya | `ActivityFeed` | Reuse — scoped to audit_logs for my ticket IDs |

### Dropped vs unit_aset (intentional — irrelevant to requester role)

- KPIs: Antrian Saya, Tertunggak >7h (pemohon has no queue to process)
- Widgets: Antrian Mengikut Umur, Lokasi Aset Teratas (pemohon submits from 1–2 locations, sparse)

---

## 4. Architecture

### File layout

```
i-smartlupus-medi/
├── app/(protected)/dashboard/page.tsx          [EDIT] — add user-role branch
├── components/dashboards/
│   ├── Section.tsx                             [NEW] — extracted from UnitAsetDashboard
│   ├── PemohonDashboard.tsx                    [NEW] — top-level role component
│   ├── AttentionTable.tsx                      [NEW] — widget #5
│   ├── AttentionTable.test.tsx                 [NEW]
│   └── UnitAsetDashboard.tsx                   [EDIT] — import Section instead of inlining
└── lib/dashboard/
    ├── types.ts                                [NEW] — shared types (extracted)
    ├── pemohon.ts                              [NEW] — fetcher + aggregation
    ├── pemohon.test.ts                         [NEW]
    └── unit-aset.ts                            [EDIT] — import shared types
```

### Routing

In `app/(protected)/dashboard/page.tsx`:

```ts
if (profile.role === "unit_aset") return <UnitAsetDashboard profile={profile} />;
if (profile.role === "user")      return <PemohonDashboard profile={profile} />;
// legacy stat-card layout remains for admin only (pending its own dashboard pass)
```

### Extractions (refactor scope)

1. **`Section` component** (~25 lines) — moves from inline in `UnitAsetDashboard.tsx:41-67` to `components/dashboards/Section.tsx`. Both role dashboards import it. Admin dashboard will too.
2. **Shared types** — move `KpiDelta`, `SparkPoint`, `HistogramBucket`, `CategoryMix`, `ActivityEntry`, `DailyFlow` from `lib/dashboard/unit-aset.ts` to `lib/dashboard/types.ts`. Both `unit-aset.ts` and `pemohon.ts` import from the neutral source.
3. **Shared helpers** (if not already exported) — `median`, `pctChange`, `bucketAge`, `bucketDurations`, `buildDailySeries`, `buildDailyMedian`, `buildDualLine`, `isoDate`, `daysAgo`, `diffHours`, `diffDays`. Move to `lib/dashboard/helpers.ts` only if needed; otherwise re-export from `unit-aset.ts` if implementation finds them already exported.

---

## 5. Components

### 5.1 `PemohonDashboard.tsx`

Top-level role component. Props: `{ profile: Profile }`. Same shape as `UnitAsetDashboard`:

- `useState<PemohonDashboardData | null>(null)`
- `useEffect`: calls `fetchPemohonDashboard(profile.id)`, sets state, catches & logs
- `<DashboardSkeleton />` while loading
- Greeting strip (reuse pattern from UnitAsetDashboard lines 92-103)
- 4 KPI cards in `grid-cols-2 md:grid-cols-4`
- Workflow section (`DualLineChart`)
- Two-up: Status donut + Duration histogram
- Two-up: Category mix + AttentionTable
- Activity feed at bottom
- **Whole-dashboard zero-state branch** (see §6): if user has literally never submitted, render Welcome panel instead of grid

Layout:

```
┌────────────────────────────────────────────────┐
│  Greeting strip                                 │
├──────┬──────┬──────┬──────────────────────────┤
│ KPI1 │ KPI2 │ KPI3 │ KPI4                      │
├──────┴──────┴──────┴──────────────────────────┤
│  Aliran Permohonan Saya (dual-line, 30d)       │
├────────────────────────┬───────────────────────┤
│  Status Permohonan     │  Taburan Masa Kelulusan│
├────────────────────────┼───────────────────────┤
│  Kategori Aset Saya    │  Permohonan Memerlukan │
│                        │  Perhatian             │
├────────────────────────┴───────────────────────┤
│  Aktiviti Terkini Saya                         │
└────────────────────────────────────────────────┘
```

### 5.2 `AttentionTable.tsx`

Purpose-built widget #5. Props: `{ rows: AttentionRow[] }`.

```ts
export interface AttentionRow {
  id: string;
  ticket_no: string;
  asset_name: string;
  reason: "ditolak" | "menunggu_lama";
  age_days: number;
  rejection_reason: string | null;  // populated when reason === "ditolak"
}
```

Row anatomy:
- Severity dot: rose for `ditolak`, amber for `menunggu_lama`
- Left: `ticket_no` (caption-size, uppercase, emerald tint)
- Middle: `asset_name` (truncated)
- Right: `Pindaan: {rejection_reason}` (truncated) for `ditolak` / `Menunggu {n} hari` for `menunggu_lama`
- Click handler: **uniform route to `/semua/${id}`** (the existing read-only detail view, which already surfaces `rejection_reason` inline at `app/(protected)/semua/[id]/page.tsx:244`). No edit/resubmit route exists yet — verified during design.
- One inline comment at the click handler: `TODO(future-feature): swap click target to /mohon/${id}/edit when ticket-revise flow exists`. Acceptable comment because the click handler is identical for both row types — future-reader needs to know why.
- Empty state: render `EmptyState` with `CheckCircle2` icon + "Tiada permohonan memerlukan perhatian"

Styling reuses the severity-dot CSS classes added in yesterday's color-token work (verified in `app/globals.css`).

---

## 6. Data Flow

### 6.1 Public interface (`lib/dashboard/pemohon.ts`)

```ts
import type { KpiDelta, SparkPoint, HistogramBucket, CategoryMix, ActivityEntry, DailyFlow } from "./types";

export interface PemohonDashboardData {
  kpis: {
    activeCount: number;                  // snapshot
    approved30d: KpiDelta;
    medianApprovalHours: KpiDelta;
    approvalRate: KpiDelta;               // 0-1
    approvedSparkline: SparkPoint[];      // 30d
    medianSparkline: SparkPoint[];        // 30d
    approvalRateSparkline: SparkPoint[];  // 30d
  };
  workflow: DailyFlow[];                  // 30d, .intake = submitted, .reviewed = completed
  statusBreakdown: { name: string; value: number; color: string }[];  // 4 entries for StatusChart
  approvalDuration: { buckets: HistogramBucket[]; medianHours: number };
  categoryMix: CategoryMix;
  attentionRows: AttentionRow[];          // max 5
  activityFeed: ActivityEntry[];          // last 24h, max 8
  /** True when user has no tickets in last 60d — drives Welcome-panel zero state */
  isBrandNewUser: boolean;
}
```

### 6.2 Query plan — 3 parallel + 1 followup

```ts
const [allTickets60d, activeSnapshot, recentRejections] = await Promise.all([
  // Q1: My tickets in last 60d → drives most KPIs, workflow, sparklines, status, categoryMix, duration histogram
  supabase.from("disposal_tickets")
    .select("id, ticket_no, asset_name, category, asset_condition, status, rejection_reason, created_at, reviewed_at, completed_at")
    .eq("created_by", userId)
    .gte("created_at", since60d),

  // Q2: Active snapshot (any age) → drives activeCount + "menunggu_lama" attention rows
  supabase.from("disposal_tickets")
    .select("id, ticket_no, asset_name, status, created_at")
    .eq("created_by", userId)
    .in("status", ["menunggu_semakan", "proses_pelupusan"])
    .order("created_at", { ascending: true }),

  // Q3: Recent ditolak → drives attention rows + KPI 4 prior period if needed
  supabase.from("disposal_tickets")
    .select("id, ticket_no, asset_name, status, created_at, reviewed_at, rejection_reason")
    .eq("created_by", userId)
    .eq("status", "ditolak")
    .order("reviewed_at", { ascending: false })
    .limit(10),
]);

// Q4: derive ticket IDs from Q1 → fetch audit log entries
const myTicketIds = allTickets60d.data?.map(t => t.id) ?? [];
const { data: auditRaw } = myTicketIds.length
  ? await supabase.from("audit_logs")
      .select("id, action, ticket_id, performed_by, created_at")
      .in("ticket_id", myTicketIds)
      .gte("created_at", since24h)
      .order("created_at", { ascending: false })
      .limit(8)
  : { data: [] };
```

### 6.3 Two-step audit feed

`audit_logs` records actions performed by reviewers ON the requester's tickets. To scope the feed to "my" tickets, we need ticket IDs from Q1 before issuing the audit query. This breaks pure parallelism: cost is one extra round-trip (~50-150ms). Acceptable.

### 6.4 Aggregation logic (all client-side)

- `activeCount`: `activeSnapshot.length` from Q2
- `approved30d.current`: Q1 tickets where `reviewed_at >= since30d AND status != "ditolak"`
- `approved30d.prior`: Q1 tickets where `reviewed_at >= since60d AND reviewed_at < since30d AND status != "ditolak"`
- `medianApprovalHours`: `median(durations)` where `durations = reviewed.map(t => diffHours(t.reviewed_at, t.created_at))`
- `approvalRate`: `(reviewed - rejected) / reviewed` (where `reviewed = Q1 tickets with reviewed_at IS NOT NULL`); `null` pctChange if denominator is 0
- Sparklines: per-day series using existing `buildDailySeries` / `buildDailyMedian` patterns
- `workflow.intake[date]`: count Q1 tickets where `created_at` is on that day (last 30d)
- `workflow.reviewed[date]`: count Q1 tickets where `completed_at` is on that day (last 30d) — note: distinct from unit_aset which uses `reviewed_at`
- `statusBreakdown`: 4 fixed buckets, count Q1 by status; colors from `chartColors(resolvedTheme)` matching legacy palette
- `approvalDuration.buckets`: reuse `bucketDurations` helper on approved-tickets durations
- `categoryMix`: reuse the unit-aset mapping (`category × asset_condition` → 5 keys including `tidak_dinyatakan`)
- `attentionRows`:
  - Start with Q3 (most-recent rejections, max 10 fetched) → mark `reason: "ditolak"`, fill `rejection_reason`
  - Add tickets from Q2 where `age_days > 7` → mark `reason: "menunggu_lama"`, leave `rejection_reason: null`
  - Sort: ditolak first (severity), then by `age_days` desc
  - Cap at 5
- `activityFeed`: map audit rows. Per §7.7 implementation probes `audit_logs.action` distinct values first, then either (a) reuses unit-aset's existing action-verb mapping if the value set overlaps, or (b) defines a pemohon-specific mapping. Filter to status-transition verbs ("approved", "rejected", "completed", etc.); suppress noise like "viewed" if present.
- `isBrandNewUser`: `allTickets60d.length === 0 && activeSnapshot.length === 0 && recentRejections.length === 0`

---

## 7. Error Handling & Edge Cases

### 7.1 Network failure

`Promise.all` collapses on any rejection. `useEffect.catch` logs; `data` stays `null`; UI stuck on skeleton. **Known weakness inherited from unit_aset — not fixed in this PR. Follow-up: shared retry/error-state UI for all role dashboards.**

### 7.2 Partial failure / null `data`

Every destructure uses `?? []` (mirrors `unit-aset.ts:207, 218, 273, ...`). Per-query failure surfaces as empty widget, not crash.

### 7.3 Sparse-data per-widget behavior

| Widget | Sparse behavior |
|---|---|
| KPI Permohonan Aktif | Shows `0` |
| KPI Diluluskan | Shows `0`, `pctChange === null` → KpiCard hides delta chip |
| KPI Median Masa | Shows `0.0 jam` (median([]) → 0) |
| KPI Kadar Kelulusan | Shows `0%`, sparkline flat |
| Aliran Permohonan Saya | Flat line at 0 |
| Status Permohonan | If `total === 0`, render `EmptyState` "Belum ada permohonan" + Inbox icon instead of empty donut |
| Taburan Masa Kelulusan | If all buckets zero, render `EmptyState` "Belum ada permohonan diluluskan" |
| Kategori Aset Saya | If all-zero CategoryMix, render `EmptyState` "Belum ada permohonan" |
| AttentionTable | Empty rows → internal `EmptyState` (see §5.2) |
| Aktiviti Terkini Saya | Empty entries → `EmptyState` "Tiada aktiviti dalam 24 jam terakhir" |

### 7.4 Whole-dashboard zero state (brand-new user)

When `data.isBrandNewUser === true`, render dedicated Welcome panel instead of the analyst grid:

```
┌─────────────────────────────────────────────────┐
│  Selamat datang, {firstName}                    │
│  Mohon pelupusan pertama anda untuk mula        │
│  ┌────────────────────┐                         │
│  │  + Mohon Baru      │  → /mohon                │
│  └────────────────────┘                         │
└─────────────────────────────────────────────────┘
```

### 7.5 Theme switching

KpiCard tones use CSS variables (verified in yesterday's color-token work). `StatusChart` needs theme palette — pass `useTheme().resolvedTheme` from PemohonDashboard the same way legacy does at `app/(protected)/dashboard/page.tsx:158-164`.

### 7.6 RLS edge case

`disposal_tickets` RLS scopes reads to `created_by = auth.uid()` (verified 2026-05-24 audit). Explicit `.eq("created_by", userId)` in our queries is defense-in-depth, not the sole authorization.

`audit_logs` RLS: **implementation-time probe required**. If pemohon can read audit_logs for their own tickets, Q4 works. If RLS denies, Q4 returns `[]` and the activity feed is permanently empty for pemohon. Two paths in that case:
- (a) loosen RLS to allow ticket-owners to read audit_logs for tickets they own (preferred — semantic match)
- (b) drop the activity feed widget for pemohon role (fallback)

Decide during implementation based on probe result.

### 7.7 Activity feed action filter

`audit_logs.action` values likely include status-change actions ("approved", "rejected", "completed") plus possibly verb-style entries. Implementation-time inspection of distinct `action` values needed. Filter to signal-rich verbs only; suppress noise like "viewed" if present.

---

## 8. Testing

### 8.1 Unit tests — `lib/dashboard/pemohon.test.ts`

Mirrors `lib/dashboard/unit-aset.test.ts`. Fixture-driven, Supabase client mocked.

| # | Test |
|---|---|
| 1 | KPI `activeCount` counts only `menunggu_semakan` + `proses_pelupusan` |
| 2 | KPI `approved30d.current` counts `reviewed_at` in last 30d AND `status != "ditolak"`; `prior` is 30-60d window |
| 3 | KPI `medianApprovalHours` uses `reviewed_at - created_at` only for reviewed tickets |
| 4 | KPI `approvalRate` excludes ditolak from numerator; denominator is reviewed count |
| 5 | KPI deltas: empty prior → `pctChange === null` |
| 6 | `workflow`: 30 daily buckets, `intake` from `created_at`, `reviewed` from `completed_at` |
| 7 | `statusBreakdown`: 4 buckets, sum matches Q1 total |
| 8 | `approvalDuration.buckets`: durations distributed across 7 histogram buckets |
| 9 | `categoryMix`: 5 keys, NULL category routes to `tidak_dinyatakan` |
| 10 | `attentionRows`: max 5, ditolak first, then by age desc; `reason` flag set correctly |
| 11 | `attentionRows` empty when no rejections + no pending → `[]` |
| 12 | `isBrandNewUser`: true when all Q1/Q2/Q3 empty; false otherwise |
| 13 | Whole-dashboard zero state: all-zero fixtures don't throw; return well-formed empties |

### 8.2 Component tests — `components/dashboards/AttentionTable.test.tsx`

| # | Test |
|---|---|
| 1 | Renders `EmptyState` when `rows.length === 0` |
| 2 | Rose dot for `reason === "ditolak"` row |
| 3 | Amber dot for `reason === "menunggu_lama"` row |
| 4 | `ditolak` row shows `rejection_reason` truncated in right cell |
| 5 | `menunggu_lama` row shows `Menunggu {n} hari` in right cell |
| 6 | Click on row calls `router.push("/semua/${id}")` |

### 8.3 What's NOT tested (intentional, matches unit_aset convention)

- `PemohonDashboard.tsx` composition — exercised by manual smoke
- Reused widgets — covered by existing tests
- Supabase RLS behavior — verified empirically post-deploy
- The Q1→Q4 round-trip — fixture data handles it without network mocking

### 8.4 Acceptance criteria

| | Pass criterion |
|---|---|
| Build | `next build` green, 0 type errors |
| Unit tests | All new pass + existing 102 still green → total ≥ 116 |
| Manual smoke | Log in as `user` test account → see analyst dashboard. Sparse-data EmptyStates render. Dark mode works on StatusChart. AttentionTable click navigates to detail. |
| Performance | `/dashboard` route size increase < 30kB (unit_aset added 21kB; pemohon should be similar or less due to reuse) |
| RLS probe | `audit_logs` accessible to ticket-owner → confirmed before merge OR widget gracefully drops |

### 8.5 Test data

Seeded test users (3 `user`-role accounts per project memory):
- `880101011234` (Test User)
- `647256478376` (testetastet)
- `841101115314` (Siti Munirah)

Yesterday's 60-ticket `[DEMO]` seed distributed across users gives realistic data for smoke. Verify with `npm run seed:demo` if needed; clean with `npm run clean:demo`.

---

## 9. Out of Scope (Tracked Follow-ups)

- **Ticket edit / resubmit flow** for rejected tickets. AttentionTable links to read-only `/semua/${id}` for now. When edit flow ships, swap click handler.
- **Shared retry/error-state UI** for all role dashboards (network-failure UX inherited weakness)
- **Admin dashboard** — next in queue, separate spec
- **Activity feed scope expansion** beyond 24h — currently fixed window per unit_aset convention
- **Server-side aggregation** — all aggregation currently client-side, which is fine for pemohon volume but may become a concern for power-users with many tickets

---

## 10. Open Items Surfaced for Implementation

1. **Audit-logs RLS probe** — confirm pemohon can read audit_logs for their own tickets; decide widget behavior accordingly (see §7.6)
2. **`audit_logs.action` value enumeration** — inspect distinct values; build filter set (see §7.7)
3. **Shared helpers location** — implementation may move helpers to `lib/dashboard/helpers.ts` if not already exported from `unit-aset.ts`. Decision deferred to implementation
4. **DualLineChart label prop** — verify whether `DualLineChart` accepts series labels via props; if labels are hardcoded inside the component, may need a minimal prop addition (1-line edit)

---

## 11. Rollback Plan

Single-PR scope. Rollback = revert the merge commit. No DB migrations, no env-var changes, no third-party integration. Safe rollback regardless of state.

---

**End of design.**
