import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type ChipTone =
  | "pending"
  | "reviewing"
  | "executing"
  | "done"
  | "rejected"
  | "neutral";

interface ChipProps {
  tone: ChipTone;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}

const tones: Record<ChipTone, string> = {
  pending:   "bg-[var(--chip-pending-bg)]   text-[var(--chip-pending-fg)]",
  reviewing: "bg-[var(--chip-reviewing-bg)] text-[var(--chip-reviewing-fg)]",
  executing: "bg-[var(--chip-executing-bg)] text-[var(--chip-executing-fg)]",
  done:      "bg-[var(--chip-done-bg)]      text-[var(--chip-done-fg)]",
  rejected:  "bg-[var(--chip-rejected-bg)]  text-[var(--chip-rejected-fg)]",
  neutral:   "bg-[var(--surface-elevated)]  text-[var(--fg-muted)]",
};

export function Chip({ tone, icon, children, className }: ChipProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 h-6 px-2.5 rounded-sm text-caption font-semibold",
        tones[tone],
        className,
      )}
    >
      {icon && <span className="[&>svg]:h-3 [&>svg]:w-3">{icon}</span>}
      {children}
    </span>
  );
}
