"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  Cell,
} from "recharts";
import type { HistogramBucket } from "@/lib/dashboard/unit-aset";

interface DurationHistogramProps {
  buckets: HistogramBucket[];
  medianHours: number;
}

/** Map median hour value to the bucket index it falls into for ReferenceLine x position. */
function medianBucketLabel(medianHours: number, buckets: HistogramBucket[]): string | null {
  const ranges: [number, number][] = [
    [0, 1], [1, 2], [2, 4], [4, 8], [8, 16], [16, 24], [24, Infinity],
  ];
  for (let i = 0; i < ranges.length; i++) {
    const [min, max] = ranges[i];
    if (medianHours >= min && medianHours < max) return buckets[i]?.label ?? null;
  }
  return null;
}

export function DurationHistogram({ buckets, medianHours }: DurationHistogramProps) {
  const axis = "var(--fg-muted)";
  const barColor = "#059669";
  const medianColor = "#e11d48";
  const medianLabel = medianBucketLabel(medianHours, buckets);

  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={buckets} margin={{ top: 16, right: 16, left: 0, bottom: 0 }}>
          <XAxis
            dataKey="label"
            tick={{ fontSize: 10, fill: axis }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: axis }}
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
            width={28}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              fontSize: 12,
            }}
            cursor={{ fill: "rgba(0,0,0,0.04)" }}
          />
          {medianLabel !== null && (
            <ReferenceLine
              x={medianLabel}
              stroke={medianColor}
              strokeDasharray="4 2"
              label={{
                value: `Median ${medianHours.toFixed(1)}j`,
                position: "top",
                fill: medianColor,
                fontSize: 11,
                fontWeight: 600,
              }}
            />
          )}
          <Bar dataKey="count" radius={[6, 6, 0, 0]} isAnimationActive={false}>
            {buckets.map((_, i) => (
              <Cell key={i} fill={barColor} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
