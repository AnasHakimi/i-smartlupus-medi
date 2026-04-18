"use client";

import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { cn } from "@/lib/utils";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const Icon = isDark ? Sun : Moon;
  const next = isDark ? "light" : "dark";
  const label = isDark ? "Tukar kepada tema terang" : "Tukar kepada tema gelap";

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
        "bg-white/10 text-white hover:bg-white/20 active:bg-white/30",
        "transition-colors duration-base ease-ios-out",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60",
      )}
    >
      <Icon className="h-4 w-4" strokeWidth={1.75} aria-hidden />
    </button>
  );
}
