"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import { useTheme } from "@/components/theme-provider";
import type { DailyFlow } from "@/lib/dashboard/unit-aset";

interface DualLineChartProps {
  data: DailyFlow[];
  /** Legend label for the `intake` line. Default: "Permohonan masuk" (unit_aset perspective). */
  intakeLabel?: string;
  /** Legend label for the `reviewed` line. Default: "Disemak oleh saya" (unit_aset perspective). */
  reviewedLabel?: string;
}

function formatTickDate(iso: string): string {
  const d = new Date(iso);
  return new Intl.DateTimeFormat("ms-MY", { day: "numeric", month: "short" }).format(d);
}

export function DualLineChart({
  data,
  intakeLabel = "Permohonan masuk",
  reviewedLabel = "Disemak oleh saya",
}: DualLineChartProps) {
  const { resolvedTheme } = useTheme();
  const grid = resolvedTheme === "dark" ? "#1f2937" : "#e5e7eb";
  const axis = resolvedTheme === "dark" ? "#9ca3af" : "#6b7280";
  const intakeColor = resolvedTheme === "dark" ? "#94a3b8" : "#64748b";
  const reviewColor = resolvedTheme === "dark" ? "#34d399" : "#059669";

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={grid} vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: axis }}
            tickFormatter={formatTickDate}
            tickLine={false}
            axisLine={false}
            minTickGap={24}
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
            labelFormatter={(label) => formatTickDate(String(label))}
          />
          <Legend
            verticalAlign="top"
            align="right"
            iconType="circle"
            wrapperStyle={{ fontSize: 12, paddingBottom: 8 }}
          />
          <Line
            type="monotone"
            dataKey="intake"
            name={intakeLabel}
            stroke={intakeColor}
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
          <Line
            type="monotone"
            dataKey="reviewed"
            name={reviewedLabel}
            stroke={reviewColor}
            strokeWidth={2.5}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
