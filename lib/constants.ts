import type { UserRole, AssetCondition, TicketStatus, DisposalMethod } from "./supabase/types";

export const STATUS_CONFIG: Record<
  TicketStatus,
  { label: string; color: string; bg: string }
> = {
  BARU: {
    label: "BARU",
    color: "text-blue-700",
    bg: "bg-blue-100",
  },
  menunggu_semakan: {
    label: "Menunggu Semakan",
    color: "text-yellow-700",
    bg: "bg-yellow-100",
  },
  proses_pelupusan: {
    label: "Proses Pelupusan",
    color: "text-orange-700",
    bg: "bg-orange-100",
  },
  selesai: {
    label: "Selesai",
    color: "text-green-700",
    bg: "bg-green-100",
  },
  ditolak: {
    label: "Ditolak",
    color: "text-red-700",
    bg: "bg-red-100",
  },
};

export const DISPOSAL_METHODS: Record<DisposalMethod, string> = {
  jualan: "Jualan",
  lelong: "Lelong",
  musnah: "Musnah",
  serah_agensi: "Serah Agensi",
};

export const ASSET_CONDITIONS: Record<AssetCondition, string> = {
  rosak: "Rosak",
  usang: "Usang",
};

export const ROLE_LABELS: Record<UserRole, string> = {
  user: "Pengguna",
  unit_aset: "Unit Aset",
  admin: "Pentadbir",
};

export const NAV_ITEMS: Record<
  UserRole,
  Array<{ href: string; label: string; icon: string }>
> = {
  user: [
    { href: "/dashboard", label: "Utama", icon: "Home" },
    { href: "/mohon", label: "Mohon", icon: "FilePlus" },
    { href: "/status", label: "Status", icon: "ClipboardList" },
    { href: "/profil", label: "Profil", icon: "User" },
  ],
  unit_aset: [
    { href: "/dashboard", label: "Utama", icon: "Home" },
    { href: "/semakan", label: "Semakan", icon: "ClipboardCheck" },
    { href: "/semua", label: "Semua", icon: "LayoutList" },
    { href: "/profil", label: "Profil", icon: "User" },
  ],
  admin: [
    { href: "/dashboard", label: "Utama", icon: "Home" },
    { href: "/pengguna", label: "Pengguna", icon: "Users" },
    { href: "/semua", label: "Semua", icon: "LayoutList" },
    { href: "/profil", label: "Profil", icon: "User" },
  ],
};

export const IC_DOMAIN = "@ic.local";
