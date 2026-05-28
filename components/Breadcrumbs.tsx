"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { BreadcrumbSegment } from "@/lib/breadcrumbs";

interface BreadcrumbsProps {
  segments: BreadcrumbSegment[];
}

export function Breadcrumbs({ segments }: BreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb" className="flex items-center min-w-0">
      <ol className="flex items-center gap-1.5 min-w-0">
        {segments.map((segment, index) => {
          const isLast = index === segments.length - 1;
          return (
            <li key={`${segment.label}-${index}`} className="flex items-center gap-1.5 min-w-0">
              {index > 0 && (
                <ChevronRight
                  className="h-3.5 w-3.5 text-[var(--fg-muted)] shrink-0"
                  aria-hidden
                />
              )}
              {isLast || !segment.href ? (
                <span
                  aria-current={isLast ? "page" : undefined}
                  className="text-footnote font-semibold text-[var(--fg)] tracking-tight truncate"
                >
                  {segment.label}
                </span>
              ) : (
                <Link
                  href={segment.href}
                  className="text-footnote font-medium text-[var(--fg-muted)] tracking-tight truncate hover:text-[var(--primary)] transition-colors focus-visible:outline-none focus-visible:underline"
                >
                  {segment.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
