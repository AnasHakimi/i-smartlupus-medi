import { createClient } from "@/lib/supabase/client";
import type { TicketStatus } from "@/lib/supabase/types";
import type {
  KpiDelta,
  SparkPoint,
  HistogramBucket,
  CategoryMix,
  ActivityEntry,
  DailyFlow,
} from "./types";
import { isoDate, daysAgo } from "./helpers";

// ─── Public types ──────────────────────────────────────────────────────

export interface AttentionRow {
  id: string;
  ticket_no: string;
  asset_name: string;
  reason: "ditolak" | "menunggu_lama";
  age_days: number;
  rejection_reason: string | null;
}

export interface PemohonDashboardData {
  kpis: {
    activeCount: number;
    approved30d: KpiDelta;
    medianApprovalHours: KpiDelta;
    approvalRate: KpiDelta;
    approvedSparkline: SparkPoint[];
    medianSparkline: SparkPoint[];
    approvalRateSparkline: SparkPoint[];
  };
  workflow: DailyFlow[];
  statusBreakdown: { name: string; value: number; color: string }[];
  approvalDuration: { buckets: HistogramBucket[]; medianHours: number };
  categoryMix: CategoryMix;
  attentionRows: AttentionRow[];
  activityFeed: ActivityEntry[];
  isBrandNewUser: boolean;
}

// ─── Pure helpers (testable in isolation) ──────────────────────────────

/**
 * Picks up to 5 attention rows for the dashboard.
 * Ditolak rows are prioritized (most recent first, by input order), then
 * oldest-waiting tickets from the active set. Caps at 5 total.
 */
export function pickAttentionRows(
  rejections: Array<{
    id: string;
    ticket_no: string;
    asset_name: string;
    created_at: string;
    rejection_reason: string | null;
  }>,
  active: Array<{
    id: string;
    ticket_no: string;
    asset_name: string;
    created_at: string;
  }>,
  now: Date = new Date(),
): AttentionRow[] {
  const ageDays = (createdAt: string) =>
    Math.floor((now.getTime() - new Date(createdAt).getTime()) / 1000 / 3600 / 24);

  const ditolakRows: AttentionRow[] = rejections.map((r) => ({
    id: r.id,
    ticket_no: r.ticket_no,
    asset_name: r.asset_name,
    reason: "ditolak" as const,
    age_days: ageDays(r.created_at),
    rejection_reason: r.rejection_reason,
  }));

  const waitingRows: AttentionRow[] = active
    .filter((t) => ageDays(t.created_at) > 7)
    .sort((a, b) => ageDays(b.created_at) - ageDays(a.created_at))
    .map((t) => ({
      id: t.id,
      ticket_no: t.ticket_no,
      asset_name: t.asset_name,
      reason: "menunggu_lama" as const,
      age_days: ageDays(t.created_at),
      rejection_reason: null,
    }));

  return [...ditolakRows, ...waitingRows].slice(0, 5);
}

/**
 * Per-day approval-rate sparkline for the requester perspective.
 * approvalRate = approved / reviewed, where approved excludes ditolak.
 */
export function buildDailyApprovalRate(
  reviews: Array<{ reviewed_at: string; status: TicketStatus }>,
  days: number,
): SparkPoint[] {
  const buckets = new Map<string, { total: number; approved: number }>();
  for (let i = 0; i < days; i++) {
    buckets.set(isoDate(daysAgo(days - 1 - i)), { total: 0, approved: 0 });
  }
  for (const r of reviews) {
    const key = isoDate(new Date(r.reviewed_at));
    const b = buckets.get(key);
    if (!b) continue;
    b.total++;
    if (r.status !== "ditolak") b.approved++;
  }
  return Array.from(buckets.entries()).map(([date, b]) => ({
    date,
    value: b.total ? b.approved / b.total : 0,
  }));
}

// ─── Main fetcher (added in Task 5) ────────────────────────────────────
