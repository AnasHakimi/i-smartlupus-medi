"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from "recharts";
import { useTheme } from "@/components/theme-provider";
import type { AgeBuckets } from "@/lib/dashboard/unit-aset";

interface AgeBucketBarProps {
  buckets: AgeBuckets;
}

const BUCKET_META: { key: keyof AgeBuckets; label: string; cssVar: string }[] = [
  { key: "fresh", label: "0-3 hari", cssVar: "--dim-severity-fresh" },
  { key: "warm", label: "4-7 hari", cssVar: "--dim-severity-warm" },
  { key: "aging", label: "8-14 hari", cssVar: "--dim-severity-aging" },
  { key: "critical", label: "15+ hari", cssVar: "--dim-severity-critical" },
];

export function AgeBucketBar({ buckets }: AgeBucketBarProps) {
  const { resolvedTheme: _resolvedTheme } = useTheme();
  void _resolvedTheme; // re-render on theme change so CSS vars resolve
  const axis = "var(--fg-muted)";

  const data = BUCKET_META.map(({ key, label, cssVar }) => ({
    name: label,
    count: buckets[key],
    fill: `var(${cssVar})`,
  }));

  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <XAxis
            dataKey="name"
            tick={{ fontSize: 11, fill: axis }}
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
          <Bar dataKey="count" radius={[6, 6, 0, 0]} isAnimationActive={false}>
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
