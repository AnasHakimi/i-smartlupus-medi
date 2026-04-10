import { cn } from "@/lib/utils";

const colorMap: Record<
  NonNullable<StatCardProps["color"]>,
  { container: string; icon: string }
> = {
  blue:   { container: "bg-blue-50",   icon: "text-blue-600" },
  yellow: { container: "bg-yellow-50", icon: "text-yellow-600" },
  orange: { container: "bg-orange-50", icon: "text-orange-600" },
  green:  { container: "bg-green-50",  icon: "text-green-600" },
  red:    { container: "bg-red-50",    icon: "text-red-600" },
  slate:  { container: "bg-slate-50",  icon: "text-slate-600" },
};

interface StatCardProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  color?: "blue" | "yellow" | "orange" | "green" | "red" | "slate";
}

export default function StatCard({
  label,
  value,
  icon,
  color = "slate",
}: StatCardProps) {
  const colors = colorMap[color];

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm hover:shadow-md transition-shadow flex items-center gap-4">
      <div
        className={cn(
          "w-12 h-12 rounded-xl flex items-center justify-center shrink-0",
          colors.container,
          colors.icon,
        )}
      >
        {icon}
      </div>
      <div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
          {label}
        </p>
        <p className="text-2xl font-black text-slate-900">{value}</p>
      </div>
    </div>
  );
}
