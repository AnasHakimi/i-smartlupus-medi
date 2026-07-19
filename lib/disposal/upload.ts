import type { AssetSubCategory } from "@/lib/supabase/types";

export const PHOTO_MAX_BYTES = 5 * 1024 * 1024; // 5MB
export const BORANG_MAX_BYTES = 10 * 1024 * 1024; // 10MB
export const BORANG_ALLOWED_TYPES = ["application/pdf", "image/jpeg", "image/png"] as const;

export type FileMeta = { type: string; size: number };
export type ValidationResult = { ok: true } | { ok: false; error: string };

export function validatePhotoFile({ type, size }: FileMeta): ValidationResult {
  if (!type.startsWith("image/")) {
    return { ok: false, error: "Format fail tidak sah. Sila pilih fail gambar." };
  }
  if (size > PHOTO_MAX_BYTES) {
    return { ok: false, error: "Saiz gambar terlalu besar. Maksimum 5MB." };
  }
  return { ok: true };
}

export function validateBorangFile({ type, size }: FileMeta): ValidationResult {
  if (!BORANG_ALLOWED_TYPES.includes(type as (typeof BORANG_ALLOWED_TYPES)[number])) {
    return { ok: false, error: "Format fail tidak sah. Sila pilih PDF, JPG atau PNG." };
  }
  if (size > BORANG_MAX_BYTES) {
    return { ok: false, error: "Saiz fail terlalu besar. Maksimum 10MB." };
  }
  return { ok: true };
}

export function borangExtension(type: string): "pdf" | "png" | "jpg" {
  if (type === "application/pdf") return "pdf";
  if (type === "image/png") return "png";
  return "jpg";
}

export function photoStoragePath(ticketId: string): string {
  return `photos/${ticketId}/asset-photo.jpg`;
}

export function borangStoragePath(ticketId: string, ext: string): string {
  return `borang_ca/${ticketId}/borang-ca.${ext}`;
}

export function canSubmitMohon({
  assetType,
  subCategory,
  hasBorang,
}: {
  assetType: string;
  subCategory: AssetSubCategory;
  hasBorang: boolean;
}): ValidationResult {
  if (!assetType.trim()) {
    return { ok: false, error: "Sila masukkan jenis/jenama/model aset." };
  }
  if (subCategory === "alat_perubatan" && !hasBorang) {
    return { ok: false, error: "Sila muat naik Borang CA sebelum menghantar." };
  }
  return { ok: true };
}
