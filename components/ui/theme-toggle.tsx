"use client";

import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { cn } from "@/lib/utils";

type Surface = "brand" | "neutral";

interface ThemeToggleProps {
  surface?: Surface;
  className?: string;
}

/**
 * Toggles between light and dark themes.
 * - surface="brand": for dark/emerald backgrounds (hero, branded header) — white/translucent
 * - surface="neutral" (default): for app chrome (sidebar, nav, cards) — token-based
 */
export function ThemeToggle({ surface = "neutral", className }: ThemeToggleProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const Icon = isDark ? Sun : Moon;
  const next = isDark ? "light" : "dark";
  const label = isDark ? "Tukar kepada tema terang" : "Tukar kepada tema gelap";

  const brand =
    "bg-white/10 text-white hover:bg-white/20 active:bg-white/30 " +
    "focus-visible:ring-2 focus-visible:ring-white/60";
  const neutral =
    "bg-transparent text-[var(--fg-muted)] hover:bg-[var(--primary-tint)] hover:text-[var(--fg)] active:bg-[var(--primary-tint)] " +
    "focus-visible:ring-2 focus-visible:ring-[var(--primary)]";

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label={label}
      title={label}
      onClick={() => setTheme(next)}
      className={cn(
        "inline-flex items-center justify-center w-10 h-10 rounded-md",
        "transition-colors duration-base ease-ios-out",
        "focus-visible:outline-none",
        surface === "brand" ? brand : neutral,
        className,
      )}
    >
      <Icon className="h-4 w-4" strokeWidth={1.75} aria-hidden />
    </button>
  );
}
