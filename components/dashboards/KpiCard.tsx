"use client";

import { ResponsiveContainer, LineChart, Line } from "recharts";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SparkPoint } from "@/lib/dashboard/unit-aset";

export type KpiTone = "emerald" | "amber" | "sky" | "rose" | "violet";

const TONE_BG: Record<KpiTone, string> = {
  emerald: "bg-[var(--kpi-emerald-bg)]",
  amber: "bg-[var(--kpi-amber-bg)]",
  sky: "bg-[var(--kpi-sky-bg)]",
  rose: "bg-[var(--kpi-rose-bg)]",
  violet: "bg-[var(--kpi-violet-bg)]",
};
const TONE_FG: Record<KpiTone, string> = {
  emerald: "text-[var(--kpi-emerald-fg)]",
  amber: "text-[var(--kpi-amber-fg)]",
  sky: "text-[var(--kpi-sky-fg)]",
  rose: "text-[var(--kpi-rose-fg)]",
  violet: "text-[var(--kpi-violet-fg)]",
};
const TONE_STROKE: Record<KpiTone, string> = {
  emerald: "var(--kpi-emerald-fg)",
  amber: "var(--kpi-amber-fg)",
  sky: "var(--kpi-sky-fg)",
  rose: "var(--kpi-rose-fg)",
  violet: "var(--kpi-violet-fg)",
};

interface KpiCardProps {
  label: string;
  value: string;
  tone: KpiTone;
  icon?: LucideIcon;
  /** Sign-aware delta vs prior period. null = no data to compare. */
  pctChange?: number | null;
  /** Which direction is "good" for this metric. Determines arrow color. */
  goodDirection?: "up" | "down";
  /** Optional sparkline series for last N days. */
  spark?: SparkPoint[];
  /** Caption shown next to delta (e.g. "30 hari"). */
  deltaWindow?: string;
}

export function KpiCard({
  label,
  value,
  tone,
  icon: Icon,
  pctChange,
  goodDirection,
  spark,
  deltaWindow,
}: KpiCardProps) {
  const hasDelta = pctChange !== undefined && pctChange !== null;
  const isPositive = hasDelta && pctChange > 0;
  const isNegative = hasDelta && pctChange < 0;
  const directionGlyph = isPositive ? "▲" : isNegative ? "▼" : null;
  // Color: good = green, bad = red, neutral = muted.
  let deltaTone: "good" | "bad" | "flat" = "flat";
  if (hasDelta && goodDirection) {
    const directionIsUp = pctChange > 0;
    const goodIsUp = goodDirection === "up";
    deltaTone = pctChange === 0 ? "flat" : directionIsUp === goodIsUp ? "good" : "bad";
  }

  return (
    <div
      className={cn(
        "rounded-xl border border-[var(--border)] p-4 flex flex-col gap-2 min-w-0",
        TONE_BG[tone],
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-caption font-medium text-[var(--fg-muted)] uppercase tracking-wide truncate">
          {label}
        </span>
        {Icon && <Icon className={cn("h-4 w-4 shrink-0", TONE_FG[tone])} aria-hidden />}
      </div>

      <div className="flex items-baseline gap-2">
        <span className={cn("text-title-1 font-bold tracking-tight tabular-nums", TONE_FG[tone])}>
          {value}
        </span>
      </div>

      <div className="flex items-end justify-between gap-2 min-h-[28px]">
        {hasDelta && directionGlyph ? (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 text-caption font-semibold",
              deltaTone === "good" && "text-emerald-600",
              deltaTone === "bad" && "text-rose-600",
              deltaTone === "flat" && "text-[var(--fg-muted)]",
            )}
          >
            <span className="text-[14px]" aria-hidden>
              {directionGlyph}
            </span>
            <span>{Math.abs(pctChange).toFixed(0)}%</span>
            {deltaWindow && (
              <span className="text-[var(--fg-muted)] font-normal ml-1">{deltaWindow}</span>
            )}
          </span>
        ) : (
          <span className="text-caption text-[var(--fg-muted)]">&nbsp;</span>
        )}

        {spark && spark.length > 1 && (
          <div className="w-20 h-7 shrink-0" aria-hidden>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={spark} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke={TONE_STROKE[tone]}
                  strokeWidth={1.5}
                  dot={false}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
