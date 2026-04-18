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
      className="fixed bottom-0 left-0 right-0 z-50 h-16 border-t border-[var(--border)] bg-[var(--surface)] md:hidden"
    >
      <div className="flex h-full items-center justify-around">
        {items.map((item) => {
          const Icon = ICON_MAP[item.icon] ?? Home;
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-label={item.label}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex flex-col items-center justify-center gap-1 px-3 min-h-[56px] rounded-lg transition-colors",
                isActive
                  ? "text-[var(--primary)] bg-[var(--primary-tint)]"
                  : "text-[var(--fg-muted)]",
              )}
            >
              <Icon className={isActive ? "h-6 w-6 stroke-[2.5]" : "h-6 w-6 stroke-[2]"} aria-hidden />
              <span className={cn("text-[11px] font-semibold tracking-tight", !isActive && "opacity-80")}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
