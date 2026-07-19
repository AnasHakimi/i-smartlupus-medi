import { cn } from "@/lib/utils";

type Size = "sm" | "md" | "lg";
type Role = "pemohon" | "penyemak" | "pelulus" | "pentadbir";

interface AvatarProps {
  name: string;
  role?: Role;
  size?: Size;
  className?: string;
}

const sizes: Record<Size, string> = {
  sm: "h-7 w-7 text-caption",
  md: "h-8 w-8 text-footnote",
  lg: "h-10 w-10 text-subhead",
};

const roleColors: Record<Role, string> = {
  pemohon:   "bg-slate-200 text-slate-700",
  penyemak:  "bg-blue-100 text-blue-800",
  pelulus:   "bg-indigo-100 text-indigo-800",
  pentadbir: "bg-emerald-100 text-emerald-800",
};

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export function Avatar({ name, role, size = "md", className }: AvatarProps) {
  const color = role ? roleColors[role] : "bg-slate-200 text-slate-700";
  return (
    <span
      aria-label={name}
      className={cn(
        "inline-flex items-center justify-center rounded-full font-semibold shrink-0",
        sizes[size],
        color,
        className,
      )}
    >
      {initials(name)}
    </span>
  );
}
