import { describe, it, expect } from "vitest";
import {
  median,
  pctChange,
  bucketAge,
  bucketDurations,
} from "./unit-aset";

describe("median", () => {
  it("returns 0 for empty array", () => {
    expect(median([])).toBe(0);
  });

  it("returns the middle value for odd-length arrays", () => {
    expect(median([1, 3, 5])).toBe(3);
    expect(median([5, 1, 3])).toBe(3); // unsorted input
  });

  it("returns the average of two middles for even-length arrays", () => {
    expect(median([1, 2, 3, 4])).toBe(2.5);
  });
});

describe("pctChange", () => {
  it("returns null when prior is 0", () => {
    expect(pctChange(10, 0)).toBeNull();
  });

  it("returns positive percent for growth", () => {
    expect(pctChange(120, 100)).toBe(20);
  });

  it("returns negative percent for decline", () => {
    expect(pctChange(80, 100)).toBe(-20);
  });

  it("returns 0 when current equals prior", () => {
    expect(pctChange(50, 50)).toBe(0);
  });
});

describe("bucketAge", () => {
  it("buckets fresh tickets (0-3 days)", () => {
    expect(bucketAge(0)).toBe("fresh");
    expect(bucketAge(3)).toBe("fresh");
  });
  it("buckets warm tickets (4-7 days)", () => {
    expect(bucketAge(4)).toBe("warm");
    expect(bucketAge(7)).toBe("warm");
  });
  it("buckets aging tickets (8-14 days)", () => {
    expect(bucketAge(8)).toBe("aging");
    expect(bucketAge(14)).toBe("aging");
  });
  it("buckets critical tickets (15+ days)", () => {
    expect(bucketAge(15)).toBe("critical");
    expect(bucketAge(99)).toBe("critical");
  });
});

describe("bucketDurations", () => {
  it("returns 7 buckets even when input is empty", () => {
    const out = bucketDurations([]);
    expect(out).toHaveLength(7);
    expect(out.every((b) => b.count === 0)).toBe(true);
  });

  it("counts each hour value into the correct bucket", () => {
    const out = bucketDurations([0.5, 1.5, 3, 5, 10, 20, 30]);
    // 0-1: 0.5 -> 1
    // 1-2: 1.5 -> 1
    // 2-4: 3 -> 1
    // 4-8: 5 -> 1
    // 8-16: 10 -> 1
    // 16-24: 20 -> 1
    // 24+: 30 -> 1
    expect(out.map((b) => b.count)).toEqual([1, 1, 1, 1, 1, 1, 1]);
  });

  it("handles boundary values consistently (lower-inclusive, upper-exclusive)", () => {
    // 1.0 belongs to "1-2j" (>= 1 and < 2), not "0-1j"
    const out = bucketDurations([1, 2, 4, 8, 16, 24]);
    expect(out.map((b) => b.count)).toEqual([0, 1, 1, 1, 1, 1, 1]);
  });
});
