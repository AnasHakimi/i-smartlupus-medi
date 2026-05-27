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
  LogOut,
  type LucideIcon,
} from "lucide-react";
import { NAV_ITEMS, ROLE_LABELS } from "@/lib/constants";
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

interface SidebarProps {
  role: UserRole;
  name: string;
  collapsed: boolean;
  onLogOut: () => void;
}

export default function Sidebar({ role, name, collapsed, onLogOut }: SidebarProps) {
  const pathname = usePathname();
  const items = NAV_ITEMS[role];
  const roleLabel = ROLE_LABELS[role];

  return (
    <aside
      className={cn(
        "hidden md:flex md:flex-col md:fixed md:top-16 md:bottom-0 z-30",
        "bg-[var(--surface)] border-r border-[var(--border)] text-[var(--fg)]",
        "transition-[width] duration-base ease-ios-out",
        collapsed ? "md:w-16" : "md:w-60",
      )}
    >
      {/* Navigation */}
      <nav aria-label="Menu utama" className={cn("flex-1 overflow-y-auto py-3", collapsed ? "px-2" : "px-3")}>
        <ul className="space-y-1">
          {items.map((item) => {
            const Icon = ICON_MAP[item.icon] ?? Home;
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  title={collapsed ? item.label : undefined}
                  className={cn(
                    "flex items-center rounded-md text-subhead font-medium transition-colors",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]",
                    collapsed
                      ? "justify-center w-11 h-11 mx-auto"
                      : "gap-3 px-3 py-2.5",
                    isActive
                      ? "bg-[var(--primary-tint)] text-[var(--primary)]"
                      : "text-[var(--fg-muted)] hover:bg-[var(--primary-tint)] hover:text-[var(--fg)]",
                  )}
                >
                  <Icon className="h-5 w-5 shrink-0" aria-hidden />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer (User Details + Logout) */}
      {!collapsed && (
        <div className="mt-auto border-t border-[var(--border)] p-4 space-y-3">
          <div className="min-w-0">
            <p className="text-subhead font-bold text-[var(--fg)] truncate">{name}</p>
            <p className="text-caption font-medium text-[var(--fg-muted)]">{roleLabel}</p>
          </div>
          <button
            type="button"
            onClick={onLogOut}
            className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-md text-subhead font-semibold text-[var(--destructive)] hover:bg-[var(--destructive-tint)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--destructive)]"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            <span>Log Keluar</span>
          </button>
        </div>
      )}
    </aside>
  );
}
