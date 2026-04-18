"use client";

import { ChevronLeft, ChevronRight, Menu } from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";

interface AppHeaderProps {
  pageTitle: string;
  sidebarCollapsed: boolean;
  onToggleSidebar: () => void;
  onOpenDrawer: () => void;
}

export function AppHeader({
  pageTitle,
  sidebarCollapsed,
  onToggleSidebar,
  onOpenDrawer,
}: AppHeaderProps) {
  const ChevronIcon = sidebarCollapsed ? ChevronRight : ChevronLeft;
  const chevronLabel = sidebarCollapsed ? "Kembangkan bar sisi" : "Runtuhkan bar sisi";

  return (
    <header className="sticky top-0 z-30 flex items-center gap-3 h-14 px-4 bg-[var(--surface)]/85 backdrop-blur border-b border-[var(--border)]">
      <button
        type="button"
        onClick={onToggleSidebar}
        aria-label={chevronLabel}
        className="hidden md:inline-flex items-center justify-center w-9 h-9 rounded-md text-[var(--fg-muted)] hover:bg-[var(--primary-tint)] hover:text-[var(--fg)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
      >
        <ChevronIcon className="h-4 w-4" aria-hidden />
      </button>

      <button
        type="button"
        onClick={onOpenDrawer}
        aria-label="Buka menu"
        className="inline-flex md:hidden items-center justify-center w-9 h-9 rounded-md text-[var(--fg-muted)] hover:bg-[var(--primary-tint)] hover:text-[var(--fg)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
      >
        <Menu className="h-4 w-4" aria-hidden />
      </button>

      <h1 className="text-subhead font-semibold text-[var(--fg)] tracking-tight truncate">
        {pageTitle}
      </h1>

      <div className="ml-auto">
        <ThemeToggle />
      </div>
    </header>
  );
}
