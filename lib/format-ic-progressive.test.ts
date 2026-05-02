import { describe, it, expect } from "vitest";
import { formatIcProgressive } from "./format-ic-progressive";

describe("formatIcProgressive", () => {
  it("returns empty string for empty input", () => {
    expect(formatIcProgressive("")).toBe("");
  });

  it("returns raw digits with no hyphen when below 7 digits", () => {
    expect(formatIcProgressive("12345")).toBe("12345");
    expect(formatIcProgressive("123456")).toBe("123456");
  });

  it("inserts first hyphen after 6 digits", () => {
    expect(formatIcProgressive("1234567")).toBe("123456-7");
    expect(formatIcProgressive("12345678")).toBe("123456-78");
  });

  it("inserts second hyphen after 8 digits", () => {
    expect(formatIcProgressive("123456789")).toBe("123456-78-9");
    expect(formatIcProgressive("123456789012")).toBe("123456-78-9012");
  });

  it("strips non-digits before formatting", () => {
    expect(formatIcProgressive("123-456-78-9012")).toBe("123456-78-9012");
    expect(formatIcProgressive("abc12345def")).toBe("12345");
  });

  it("truncates at 12 digits", () => {
    expect(formatIcProgressive("12345678901234567")).toBe("123456-78-9012");
  });
});
