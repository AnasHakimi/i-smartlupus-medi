import type { SparkPoint, AgeBuckets, HistogramBucket, DailyFlow } from "./types";
import type { TicketStatus } from "@/lib/supabase/types";

// ─── Pure math ──────────────────────────────────────────────────────────

export function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
}

export function pctChange(current: number, prior: number): number | null {
  if (prior === 0) return null;
  return ((current - prior) / prior) * 100;
}

// ─── Bucketers ──────────────────────────────────────────────────────────

export function bucketAge(daysOld: number): keyof AgeBuckets {
  if (daysOld <= 3) return "fresh";
  if (daysOld <= 7) return "warm";
  if (daysOld <= 14) return "aging";
  return "critical";
}

const DURATION_BUCKETS: { label: string; max: number }[] = [
  { label: "0-1j", max: 1 },
  { label: "1-2j", max: 2 },
  { label: "2-4j", max: 4 },
  { label: "4-8j", max: 8 },
  { label: "8-16j", max: 16 },
  { label: "16-24j", max: 24 },
  { label: "24j+", max: Infinity },
];

export function bucketDurations(hours: number[]): HistogramBucket[] {
  return DURATION_BUCKETS.map(({ label, max }, i) => {
    const min = i === 0 ? 0 : DURATION_BUCKETS[i - 1].max;
    const count = hours.filter((h) => h >= min && h < max).length;
    return { label, count };
  });
}

// ─── Date helpers ───────────────────────────────────────────────────────

export function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

export function diffHours(later: string, earlier: string): number {
  return (new Date(later).getTime() - new Date(earlier).getTime()) / 1000 / 3600;
}

export function diffDays(later: Date, earlier: string): number {
  return (later.getTime() - new Date(earlier).getTime()) / 1000 / 3600 / 24;
}

// ─── Series builders ────────────────────────────────────────────────────

export function buildDailySeries(timestamps: string[], days: number): SparkPoint[] {
  const counts = new Map<string, number>();
  for (let i = 0; i < days; i++) {
    counts.set(isoDate(daysAgo(days - 1 - i)), 0);
  }
  for (const ts of timestamps) {
    const key = isoDate(new Date(ts));
    if (counts.has(key)) counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return Array.from(counts.entries()).map(([date, value]) => ({ date, value }));
}

export function buildDailyMedian(
  reviews: Array<{ created_at: string; reviewed_at: string }>,
  days: number,
): SparkPoint[] {
  const bucketHours = new Map<string, number[]>();
  for (let i = 0; i < days; i++) {
    bucketHours.set(isoDate(daysAgo(days - 1 - i)), []);
  }
  for (const r of reviews) {
    const key = isoDate(new Date(r.reviewed_at));
    if (bucketHours.has(key)) {
      bucketHours.get(key)!.push(diffHours(r.reviewed_at, r.created_at));
    }
  }
  return Array.from(bucketHours.entries()).map(([date, hrs]) => ({
    date,
    value: median(hrs),
  }));
}

export function buildDailyRejectionRate(
  reviews: Array<{ reviewed_at: string; status: TicketStatus }>,
  days: number,
): SparkPoint[] {
  const buckets = new Map<string, { total: number; rejected: number }>();
  for (let i = 0; i < days; i++) {
    buckets.set(isoDate(daysAgo(days - 1 - i)), { total: 0, rejected: 0 });
  }
  for (const r of reviews) {
    const key = isoDate(new Date(r.reviewed_at));
    const b = buckets.get(key);
    if (!b) continue;
    b.total++;
    if (r.status === "ditolak") b.rejected++;
  }
  return Array.from(buckets.entries()).map(([date, b]) => ({
    date,
    value: b.total ? b.rejected / b.total : 0,
  }));
}

export function buildDualLine(
  intake: Array<{ created_at: string }>,
  reviews: Array<{ reviewed_at: string }>,
  days: number,
): DailyFlow[] {
  const intakeCounts = new Map<string, number>();
  const reviewCounts = new Map<string, number>();
  for (let i = 0; i < days; i++) {
    const key = isoDate(daysAgo(days - 1 - i));
    intakeCounts.set(key, 0);
    reviewCounts.set(key, 0);
  }
  for (const r of intake) {
    const key = isoDate(new Date(r.created_at));
    if (intakeCounts.has(key)) intakeCounts.set(key, intakeCounts.get(key)! + 1);
  }
  for (const r of reviews) {
    const key = isoDate(new Date(r.reviewed_at));
    if (reviewCounts.has(key)) reviewCounts.set(key, reviewCounts.get(key)! + 1);
  }
  return Array.from(intakeCounts.keys()).map((date) => ({
    date,
    intake: intakeCounts.get(date) ?? 0,
    reviewed: reviewCounts.get(date) ?? 0,
  }));
}
