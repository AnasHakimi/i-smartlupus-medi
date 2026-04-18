"use client";

import { Monitor, Sun, Moon, type LucideIcon } from "lucide-react";
import { useTheme, type Theme } from "@/components/theme-provider";
import { cn } from "@/lib/utils";

const OPTIONS: { value: Theme; label: string; Icon: LucideIcon }[] = [
  { value: "system", label: "Sistem", Icon: Monitor },
  { value: "light",  label: "Terang", Icon: Sun },
  { value: "dark",   label: "Gelap",  Icon: Moon },
];

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div
      role="radiogroup"
      aria-label="Tema paparan"
      className="inline-flex rounded-lg p-1 bg-[var(--surface-elevated)] border border-[var(--border)]"
    >
      {OPTIONS.map(({ value, label, Icon }) => {
        const active = theme === value;
        return (
          <button
            key={value}
            role="radio"
            aria-checked={active}
            aria-label={label}
            title={label}
            onClick={() => setTheme(value)}
            className={cn(
              "inline-flex items-center justify-center w-10 h-10 rounded-md",
              "transition-colors duration-base ease-ios-out",
              active
                ? "bg-[var(--surface)] text-[var(--fg)] shadow-sm"
                : "text-[var(--fg-muted)] hover:text-[var(--fg)]",
            )}
          >
            <Icon className="h-4 w-4" strokeWidth={active ? 2.25 : 1.75} aria-hidden />
          </button>
        );
      })}
    </div>
  );
}
