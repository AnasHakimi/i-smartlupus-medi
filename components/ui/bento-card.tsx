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
        "relative rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm overflow-hidden",
        "transition-[transform,box-shadow,border-color] duration-base ease-ios-out",
        "hover:-translate-y-px hover:shadow-md hover:border-[var(--border-strong)]",
        "before:absolute before:top-0 before:left-0 before:right-0 before:h-[3px]",
        "before:bg-gradient-to-r before:from-[var(--primary)]/70 before:via-[var(--primary)]/30 before:to-transparent",
        span === 2 && "col-span-2",
        className,
      )}
    >
      {children}
    </div>
  );
}
