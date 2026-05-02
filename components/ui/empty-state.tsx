import type { ReactNode } from "react";
import { Button } from "./button";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      role="region"
      aria-label={title}
      className={cn(
        "flex flex-col items-center text-center gap-3 px-6 py-12",
        "rounded-xl bg-[var(--surface)] border border-dashed border-[var(--border)]",
        className,
      )}
    >
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[var(--primary-tint)] text-[var(--primary)] [&>svg]:h-6 [&>svg]:w-6">
        {icon}
      </div>
      <div className="space-y-1">
        <p className="text-title-3 font-semibold text-[var(--fg)]">{title}</p>
        {description && (
          <p className="text-footnote text-[var(--fg-muted)] max-w-sm">{description}</p>
        )}
      </div>
      {action && (
        <Button onClick={action.onClick} className="mt-2">
          {action.label}
        </Button>
      )}
    </div>
  );
}
