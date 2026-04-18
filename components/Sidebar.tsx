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
  ChevronLeft,
  ChevronRight,
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

type AvatarRole = "pemohon" | "penyemak" | "pentadbir";
function avatarRole(role: UserRole): AvatarRole {
  if (role === "user") return "pemohon";
  if (role === "unit_aset") return "penyemak";
  return "pentadbir";
}
const avatarBg: Record<AvatarRole, string> = {
  pemohon:   "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  penyemak:  "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  pentadbir: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
};

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

interface SidebarProps {
  role: UserRole;
  name: string;
  collapsed: boolean;
  onToggleCollapsed: () => void;
}

export default function Sidebar({ role, name, collapsed, onToggleCollapsed }: SidebarProps) {
  const pathname = usePathname();
  const items = NAV_ITEMS[role];
  const roleLabel = ROLE_LABELS[role];
  const ChevronIcon = collapsed ? ChevronRight : ChevronLeft;
  const chevronLabel = collapsed ? "Kembangkan bar sisi" : "Runtuhkan bar sisi";

  return (
    <aside
      className={cn(
        "hidden md:flex md:flex-col md:fixed md:inset-y-0 z-40",
        "bg-[var(--surface)] border-r border-[var(--border)] text-[var(--fg)]",
        "transition-[width] duration-base ease-ios-out",
        collapsed ? "md:w-16" : "md:w-60",
      )}
    >
      {/* Header */}
      <div
        className={cn(
          "flex items-center border-b border-[var(--border)]",
          collapsed ? "justify-center py-4" : "justify-between gap-2 px-5 py-4",
        )}
      >
        <div className={cn("flex items-center gap-2 min-w-0", collapsed && "justify-center")}>
          <div className="inline-flex items-center justify-center w-8 h-8 rounded-md bg-[var(--primary)] text-[var(--on-primary)] font-black text-xs flex-shrink-0">
            iS
          </div>
          {!collapsed && (
            <span className="text-subhead font-semibold text-[var(--primary)] tracking-tight truncate">
              i-SMARTLUPUS
            </span>
          )}
        </div>
        {!collapsed && (
          <button
            type="button"
            onClick={onToggleCollapsed}
            aria-label={chevronLabel}
            className="inline-flex items-center justify-center w-7 h-7 rounded-md text-[var(--fg-muted)] hover:bg-[var(--primary-tint)] hover:text-[var(--fg)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
          >
            <ChevronIcon className="h-4 w-4" aria-hidden />
          </button>
        )}
      </div>

      {collapsed && (
        <button
          type="button"
          onClick={onToggleCollapsed}
          aria-label={chevronLabel}
          className="mx-auto mt-2 inline-flex items-center justify-center w-8 h-8 rounded-md text-[var(--fg-muted)] hover:bg-[var(--primary-tint)] hover:text-[var(--fg)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
        >
          <ChevronIcon className="h-4 w-4" aria-hidden />
        </button>
      )}

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

      {/* Footer (hidden when collapsed) */}
      {!collapsed && (
        <div className="border-t border-[var(--border)] px-4 py-3 flex items-center gap-3">
          <span
            aria-label={name}
            className={cn(
              "inline-flex items-center justify-center h-10 w-10 rounded-full font-semibold text-footnote flex-shrink-0",
              avatarBg[avatarRole(role)],
            )}
          >
            {initials(name)}
          </span>
          <div className="min-w-0">
            <p className="text-subhead font-semibold text-[var(--fg)] truncate">{name}</p>
            <p className="text-caption text-[var(--fg-muted)]">{roleLabel}</p>
          </div>
        </div>
      )}
    </aside>
  );
}
