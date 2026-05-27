"use client";

import * as Dialog from "@radix-ui/react-dialog";
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
  X,
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

interface MobileDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  role: UserRole;
  name: string;
  onLogOut: () => void;
}

export function MobileDrawer({ open, onOpenChange, role, name, onLogOut }: MobileDrawerProps) {
  const pathname = usePathname();
  const items = NAV_ITEMS[role];
  const roleLabel = ROLE_LABELS[role];

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm animate-fade-in md:hidden" />
        <Dialog.Content
          className="fixed top-0 left-0 bottom-0 z-50 w-72 bg-[var(--surface)] text-[var(--fg)] shadow-xl animate-slide-in-left md:hidden focus:outline-none flex flex-col"
          aria-describedby={undefined}
        >
          {/* Header */}
          <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-[var(--border)]">
            <div className="flex items-center gap-2 min-w-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/jata-negara.png"
                alt="Jata Negara Malaysia"
                className="h-10 w-auto shrink-0"
              />
              <div className="flex flex-col justify-center min-w-0 leading-tight">
                <Dialog.Title className="text-[13px] font-semibold text-[var(--fg)] tracking-tight truncate">
                  i-SMARTLUPUS
                </Dialog.Title>
                <span className="text-[10px] text-[var(--fg)] truncate">
                  Hospital Besut
                </span>
                <span className="text-[10px] text-[var(--fg)] truncate">
                  Terengganu
                </span>
              </div>
            </div>
            <Dialog.Close asChild>
              <button
                type="button"
                aria-label="Tutup"
                className="-mr-2 p-2 rounded-md text-[var(--fg-muted)] hover:bg-[var(--primary-tint)] transition-colors shrink-0"
              >
                <X className="h-4 w-4" />
              </button>
            </Dialog.Close>
          </div>

          {/* Navigation */}
          <nav aria-label="Menu utama" className="flex-1 overflow-y-auto p-4">
            <ul className="space-y-1">
              {items.map((item) => {
                const Icon = ICON_MAP[item.icon] ?? Home;
                const isActive = pathname ? (pathname === item.href || pathname.startsWith(item.href + "/")) : false;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={isActive ? "page" : undefined}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-md text-subhead font-medium transition-colors",
                        isActive
                          ? "bg-[var(--primary-tint)] text-[var(--primary)]"
                          : "text-[var(--fg-muted)] hover:bg-[var(--primary-tint)] hover:text-[var(--fg)]",
                      )}
                    >
                      <Icon className="h-5 w-5 shrink-0" aria-hidden />
                      <span className="truncate">{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Footer (User Details + Logout) */}
          <div className="border-t border-[var(--border)] p-6 space-y-4">
            <div className="min-w-0">
              <p className="text-body font-bold text-[var(--fg)] truncate">{name}</p>
              <p className="text-footnote font-medium text-[var(--fg-muted)]">{roleLabel}</p>
            </div>
            <button
              type="button"
              onClick={onLogOut}
              className="flex items-center gap-2.5 w-full px-3 py-3 rounded-md text-subhead font-semibold text-[var(--destructive)] bg-[var(--destructive-tint)] hover:brightness-95 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--destructive)]"
            >
              <LogOut className="h-4 w-4 shrink-0" />
              <span>Log Keluar</span>
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
