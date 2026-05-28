import type { UserRole, AssetCondition, TicketStatus, DisposalMethod, AssetCategory, AssetSubCategory } from "./supabase/types";

export const STATUS_CONFIG: Record<
  TicketStatus,
  { label: string; color: string; bg: string }
> = {
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

export const ASSET_CATEGORIES: Record<AssetCategory, string> = {
  harta_modal: "Harta Modal",
  aset_bernilai_rendah: "Aset Bernilai Rendah",
};

export const ASSET_SUB_CATEGORIES: Record<AssetSubCategory, string> = {
  alat_perubatan: "Alat Perubatan",
  bukan_alat_perubatan: "Bukan Alat Perubatan",
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
  // Note: /profil is intentionally NOT in NAV_ITEMS — it lives in the
  // ProfileMenu dropdown in AppHeader (top-right) instead of the main nav.
  user: [
    { href: "/dashboard", label: "Utama", icon: "Home" },
    { href: "/status", label: "Status", icon: "ClipboardList" },
    { href: "/mohon", label: "Mohon", icon: "Plus" },
    { href: "/semua", label: "Semua", icon: "LayoutList" },
  ],
  unit_aset: [
    { href: "/dashboard", label: "Utama", icon: "Home" },
    { href: "/semua", label: "Semua", icon: "LayoutList" },
    { href: "/semakan", label: "Semakan", icon: "ClipboardCheck" },
    { href: "/status", label: "Status", icon: "ClipboardList" },
  ],
  admin: [
    { href: "/dashboard", label: "Utama", icon: "Home" },
    { href: "/semua", label: "Semua", icon: "LayoutList" },
    { href: "/pengguna", label: "Pengguna", icon: "Users" },
    { href: "/status", label: "Status", icon: "ClipboardList" },
  ],
};

export const IC_DOMAIN = "@ic.local";
