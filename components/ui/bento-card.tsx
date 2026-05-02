import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface BentoCardProps {
  children: ReactNode;
  span?: 1 | 2;
  className?: string;
}

export function BentoCard({ children, span = 1, className }: BentoCardProps) {
  return (
    <div
      className={cn(
        "relative rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-tactile)] overflow-hidden",
        "transition-all duration-base ease-ios-out",
        "hover:-translate-y-0.5 hover:shadow-[var(--shadow-premium)] hover:border-[var(--border-strong)]",
        // Subtle mesh gradient background
        "before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_top_right,var(--primary-tint),transparent_70%)] before:opacity-40",
        // Clinical inner glow border
        "after:absolute after:inset-0 after:rounded-xl after:shadow-[var(--shadow-inner-glow)] after:pointer-events-none",
        span === 2 && "col-span-2",
        className,
      )}
    >
      <div className="relative z-10">{children}</div>
    </div>
  );
}
