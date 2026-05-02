"use client";

import type { ReactNode } from "react";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface ListItemProps {
  leading?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  trailing?: ReactNode;
  onClick?: () => void;
  showChevron?: boolean;
  className?: string;
}

export function ListItem({
  leading,
  title,
  subtitle,
  trailing,
  onClick,
  showChevron = true,
  className,
}: ListItemProps) {
  const content = (
    <div
      data-list-item="true"
      className={cn(
        "flex items-center gap-3 px-4 min-h-[56px] py-3 w-full",
        "border-b border-[var(--border)] bg-[var(--surface)]",
        onClick &&
          "transition-colors duration-base ease-ios-out active:bg-[var(--primary-tint)] cursor-pointer text-left",
        className,
      )}
    >
      {leading && <div className="shrink-0">{leading}</div>}
      <div className="flex-1 min-w-0">
        <div className="text-body text-[var(--fg)] truncate">{title}</div>
        {subtitle && (
          <div className="text-footnote text-[var(--fg-muted)] truncate">{subtitle}</div>
        )}
      </div>
      {trailing && <div className="shrink-0">{trailing}</div>}
      {onClick && showChevron && !trailing && (
        <ChevronRight className="h-4 w-4 text-[var(--fg-muted)] shrink-0" aria-hidden />
      )}
    </div>
  );

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className="block w-full">
        {content}
      </button>
    );
  }
  return content;
}
