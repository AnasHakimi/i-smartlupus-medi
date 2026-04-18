import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatDelta {
  value: number;
  direction: "up" | "down";
}

interface StatProps {
  label: string;
  value: number | string;
  delta?: StatDelta;
  trend?: number[];
  className?: string;
}

function Sparkline({ data }: { data: number[] }) {
  const width = 80;
  const height = 24;
  if (data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const step = width / (data.length - 1);
  const points = data
    .map((v, i) => `${i * step},${height - ((v - min) / range) * height}`)
    .join(" ");
  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      aria-hidden
      className="text-[var(--primary)]"
    >
      <polyline
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
}

export function Stat({ label, value, delta, trend, className }: StatProps) {
  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <p className="text-footnote text-[var(--fg-muted)] truncate">{label}</p>
      <div className="flex items-end justify-between gap-2">
        <p className="text-title-1 font-semibold tabular-nums text-[var(--fg)]">{value}</p>
        {trend && <Sparkline data={trend} />}
      </div>
      {delta && (
        <div
          className={cn(
            "inline-flex items-center gap-0.5 text-caption font-medium",
            delta.direction === "up"
              ? "text-[var(--chip-done-fg)]"
              : "text-[var(--chip-rejected-fg)]",
          )}
        >
          {delta.direction === "up" ? (
            <ArrowUpRight className="h-3 w-3" aria-hidden />
          ) : (
            <ArrowDownRight className="h-3 w-3" aria-hidden />
          )}
          <span>{delta.value.toFixed(1)}%</span>
          <span className="text-[var(--fg-muted)] font-normal">vs semalam</span>
        </div>
      )}
    </div>
  );
}
