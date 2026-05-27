"use client";

import type { LocationCount } from "@/lib/dashboard/unit-aset";

interface TopLocationsBarProps {
  data: LocationCount[];
}

export function TopLocationsBar({ data }: TopLocationsBarProps) {
  const max = Math.max(1, ...data.map((d) => d.count));

  return (
    <div className="flex flex-col gap-2.5 py-1">
      {data.length === 0 ? (
        <p className="text-footnote text-[var(--fg-muted)] py-8 text-center">
          Tiada data lokasi
        </p>
      ) : (
        data.map((row, i) => {
          const pct = (row.count / max) * 100;
          // Fade saturation top-to-bottom for the leaderboard feel
          const alpha = 1 - (i / Math.max(1, data.length)) * 0.55;
          return (
            <div key={row.location + i} className="flex items-center gap-3 min-w-0">
              <span className="text-caption font-medium text-[var(--fg-muted)] w-32 shrink-0 truncate">
                {row.location}
              </span>
              <div className="flex-1 h-2.5 rounded-full bg-[var(--border)]/40 overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${pct}%`,
                    backgroundColor: "var(--primary)",
                    opacity: alpha,
                  }}
                  aria-hidden
                />
              </div>
              <span className="text-caption font-semibold text-[var(--fg)] tabular-nums w-10 text-right shrink-0">
                {row.count}
              </span>
            </div>
          );
        })
      )}
    </div>
  );
}
