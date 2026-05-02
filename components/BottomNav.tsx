"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Plus,
  ClipboardList,
  User,
  ClipboardCheck,
  List,
  Users,
  FilePlus,
  LayoutList,
  type LucideIcon,
} from "lucide-react";
import { NAV_ITEMS } from "@/lib/constants";
import type { UserRole } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";

const ICON_MAP: Record<string, LucideIcon> = {
  Home,
  Plus,
  ClipboardList,
  User,
  ClipboardCheck,
  List,
  Users,
  FilePlus,
  LayoutList,
};

interface BottomNavProps {
  role: UserRole;
}

export default function BottomNav({ role }: BottomNavProps) {
  const pathname = usePathname();
  const items = NAV_ITEMS[role];

  return (
    <nav
      aria-label="Menu utama"
      className="fixed bottom-0 left-0 right-0 z-50 h-16 border-t border-[var(--border)] bg-[var(--surface)] md:hidden pb-safe"
    >
      <div className="relative flex h-full items-center justify-around px-2">
        {items.map((item, index) => {
          const Icon = ICON_MAP[item.icon] ?? Home;
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          const isCenter = index === 2;

          if (isCenter) {
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-label={item.label}
                className={cn(
                  "relative -top-4 flex h-20 w-20 flex-col items-center justify-center rounded-full shadow-lg transition-transform active:scale-95",
                  "bg-[var(--primary)] text-[var(--on-primary)]",
                )}
              >
                <Icon className="h-7 w-7 stroke-[2.5]" aria-hidden />
                <span className="text-[10px] font-bold tracking-tight mt-1 uppercase">
                  {item.label}
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-label={item.label}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex flex-col items-center justify-center gap-1 min-w-[64px] transition-colors",
                isActive ? "text-[var(--primary)]" : "text-[var(--fg-muted)]",
              )}
            >
              <Icon className={cn("h-5 w-5", isActive ? "stroke-[2.5]" : "stroke-[2]")} aria-hidden />
              <span className={cn("text-[10px] font-semibold tracking-tight")}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
