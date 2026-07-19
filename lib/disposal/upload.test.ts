import { describe, it, expect } from "vitest";
import {
  validatePhotoFile,
  validateBorangFile,
  borangExtension,
  photoStoragePath,
  borangStoragePath,
  canSubmitMohon,
  PHOTO_MAX_BYTES,
  BORANG_MAX_BYTES,
} from "./upload";

describe("validatePhotoFile", () => {
  it("accepts an image under the size limit", () => {
    expect(validatePhotoFile({ type: "image/jpeg", size: 1024 })).toEqual({ ok: true });
    expect(validatePhotoFile({ type: "image/png", size: PHOTO_MAX_BYTES })).toEqual({ ok: true });
  });

  it("rejects a non-image file", () => {
    const r = validatePhotoFile({ type: "application/pdf", size: 1024 });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toBe("Format fail tidak sah. Sila pilih fail gambar.");
  });

  it("rejects an image over 5MB", () => {
    const r = validatePhotoFile({ type: "image/jpeg", size: PHOTO_MAX_BYTES + 1 });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toBe("Saiz gambar terlalu besar. Maksimum 5MB.");
  });
});

describe("validateBorangFile", () => {
  it("accepts PDF, JPG and PNG under the size limit", () => {
    expect(validateBorangFile({ type: "application/pdf", size: 1024 })).toEqual({ ok: true });
    expect(validateBorangFile({ type: "image/jpeg", size: 1024 })).toEqual({ ok: true });
    expect(validateBorangFile({ type: "image/png", size: BORANG_MAX_BYTES })).toEqual({ ok: true });
  });

  it("rejects an unsupported type", () => {
    const r = validateBorangFile({ type: "image/gif", size: 1024 });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toBe("Format fail tidak sah. Sila pilih PDF, JPG atau PNG.");
  });

  it("rejects a file over 10MB", () => {
    const r = validateBorangFile({ type: "application/pdf", size: BORANG_MAX_BYTES + 1 });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toBe("Saiz fail terlalu besar. Maksimum 10MB.");
  });
});

describe("borangExtension", () => {
  it("maps mime types to file extensions", () => {
    expect(borangExtension("application/pdf")).toBe("pdf");
    expect(borangExtension("image/png")).toBe("png");
    expect(borangExtension("image/jpeg")).toBe("jpg");
  });
});

describe("storage paths", () => {
  it("builds a ticket-keyed photo path", () => {
    expect(photoStoragePath("abc-123")).toBe("photos/abc-123/asset-photo.jpg");
  });

  it("builds a ticket-keyed borang path with the given extension", () => {
    expect(borangStoragePath("abc-123", "pdf")).toBe("borang_ca/abc-123/borang-ca.pdf");
    expect(borangStoragePath("abc-123", "png")).toBe("borang_ca/abc-123/borang-ca.png");
  });
});

describe("canSubmitMohon", () => {
  it("blocks when asset type is blank", () => {
    const r = canSubmitMohon({ assetType: "   ", subCategory: "bukan_alat_perubatan", hasBorang: false });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toBe("Sila masukkan jenis/jenama/model aset.");
  });

  it("requires a Borang CA for alat_perubatan", () => {
    const r = canSubmitMohon({ assetType: "Ventilator", subCategory: "alat_perubatan", hasBorang: false });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toBe("Sila muat naik Borang CA sebelum menghantar.");
  });

  it("allows alat_perubatan once a Borang CA is attached", () => {
    expect(
      canSubmitMohon({ assetType: "Ventilator", subCategory: "alat_perubatan", hasBorang: true }),
    ).toEqual({ ok: true });
  });

  it("does not require a Borang CA for bukan_alat_perubatan", () => {
    expect(
      canSubmitMohon({ assetType: "Kerusi", subCategory: "bukan_alat_perubatan", hasBorang: false }),
    ).toEqual({ ok: true });
  });
});
