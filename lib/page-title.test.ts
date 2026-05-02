import { describe, it, expect } from "vitest";
import { getPageTitle } from "./page-title";

describe("getPageTitle", () => {
  it("maps canonical routes to Malay titles", () => {
    expect(getPageTitle("/dashboard")).toBe("Papan Pemuka");
    expect(getPageTitle("/mohon")).toBe("Mohon Pelupusan");
    expect(getPageTitle("/semakan")).toBe("Semakan");
    expect(getPageTitle("/semua")).toBe("Semua Permohonan");
    expect(getPageTitle("/status")).toBe("Status Permohonan");
    expect(getPageTitle("/pengguna")).toBe("Pengguna");
    expect(getPageTitle("/profil")).toBe("Profil");
  });

  it("matches /semua/:id as ticket detail (more specific than /semua)", () => {
    expect(getPageTitle("/semua/abc-123")).toBe("Butiran Permohonan");
    expect(getPageTitle("/semua/1")).toBe("Butiran Permohonan");
  });

  it("falls back to 'i-SMARTLUPUS' for unknown paths", () => {
    expect(getPageTitle("/unknown")).toBe("i-SMARTLUPUS");
    expect(getPageTitle("/")).toBe("i-SMARTLUPUS");
    expect(getPageTitle("")).toBe("i-SMARTLUPUS");
  });
});
