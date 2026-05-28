import { describe, it, expect } from "vitest";
import { pickAttentionRows, buildDailyApprovalRate } from "./pemohon";

describe("pickAttentionRows", () => {
  const now = new Date("2026-05-28T10:00:00.000Z");

  it("returns empty array when no rejections and no active tickets", () => {
    expect(pickAttentionRows([], [], now)).toEqual([]);
  });

  it("prioritizes ditolak rows first, then long-waiting active", () => {
    const rejections = [
      {
        id: "r1",
        ticket_no: "TIC-001",
        asset_name: "Komputer",
        created_at: "2026-05-20T00:00:00Z",
        rejection_reason: "Foto tidak jelas",
      },
    ];
    const active = [
      // 12 days old → menunggu_lama
      { id: "a1", ticket_no: "TIC-002", asset_name: "Pencetak", created_at: "2026-05-16T00:00:00Z" },
      // 3 days old → not menunggu_lama, filtered out
      { id: "a2", ticket_no: "TIC-003", asset_name: "Skanner", created_at: "2026-05-25T00:00:00Z" },
    ];
    const result = pickAttentionRows(rejections, active, now);
    expect(result.length).toBe(2);
    expect(result[0].reason).toBe("ditolak");
    expect(result[0].rejection_reason).toBe("Foto tidak jelas");
    expect(result[1].reason).toBe("menunggu_lama");
    expect(result[1].ticket_no).toBe("TIC-002");
  });

  it("caps total at 5 rows", () => {
    const rejections = Array.from({ length: 4 }, (_, i) => ({
      id: `r${i}`,
      ticket_no: `TIC-R${i}`,
      asset_name: `Reject ${i}`,
      created_at: "2026-05-20T00:00:00Z",
      rejection_reason: "reason",
    }));
    const active = Array.from({ length: 4 }, (_, i) => ({
      id: `a${i}`,
      ticket_no: `TIC-A${i}`,
      asset_name: `Active ${i}`,
      created_at: "2026-05-10T00:00:00Z", // 18 days → menunggu_lama
    }));
    const result = pickAttentionRows(rejections, active, now);
    expect(result.length).toBe(5);
    expect(result.filter((r) => r.reason === "ditolak").length).toBe(4);
    expect(result.filter((r) => r.reason === "menunggu_lama").length).toBe(1);
  });

  it("sorts menunggu_lama by age descending (oldest first)", () => {
    const active = [
      { id: "a1", ticket_no: "TIC-NEW", asset_name: "Newer", created_at: "2026-05-18T00:00:00Z" }, // 10d
      { id: "a2", ticket_no: "TIC-OLD", asset_name: "Older", created_at: "2026-05-10T00:00:00Z" }, // 18d
    ];
    const result = pickAttentionRows([], active, now);
    expect(result[0].ticket_no).toBe("TIC-OLD");
    expect(result[1].ticket_no).toBe("TIC-NEW");
  });

  it("excludes active tickets younger than 8 days", () => {
    const active = [
      { id: "a1", ticket_no: "TIC-YOUNG", asset_name: "Young", created_at: "2026-05-25T00:00:00Z" }, // 3d
    ];
    expect(pickAttentionRows([], active, now)).toEqual([]);
  });
});

describe("buildDailyApprovalRate", () => {
  it("returns N days of zero rate when no reviews", () => {
    const result = buildDailyApprovalRate([], 7);
    expect(result.length).toBe(7);
    expect(result.every((p) => p.value === 0)).toBe(true);
  });

  it("computes per-day approval rate excluding ditolak from numerator", () => {
    const today = new Date();
    const isoDateStr = (d: Date) => d.toISOString().slice(0, 10);
    const todayIso = isoDateStr(today);
    const reviews = [
      { reviewed_at: `${todayIso}T10:00:00Z`, status: "selesai" as const },
      { reviewed_at: `${todayIso}T11:00:00Z`, status: "proses_pelupusan" as const },
      { reviewed_at: `${todayIso}T12:00:00Z`, status: "ditolak" as const },
    ];
    const result = buildDailyApprovalRate(reviews, 1);
    expect(result[0].value).toBeCloseTo(2 / 3, 5);
  });
});
