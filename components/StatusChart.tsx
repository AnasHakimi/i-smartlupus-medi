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
