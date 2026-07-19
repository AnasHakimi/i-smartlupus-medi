import { describe, it, expect } from "vitest";
import { isValidEmail } from "./utils";

describe("isValidEmail", () => {
  it("accepts normal addresses", () => {
    expect(isValidEmail("nama@hospital.gov.my")).toBe(true);
    expect(isValidEmail("a.b-c@sub.domain.co")).toBe(true);
  });

  it("trims surrounding whitespace before checking", () => {
    expect(isValidEmail("  user@example.com  ")).toBe(true);
  });

  it("rejects obvious non-emails", () => {
    expect(isValidEmail("")).toBe(false);
    expect(isValidEmail("plainstring")).toBe(false);
    expect(isValidEmail("no@domain")).toBe(false); // no dot in domain
    expect(isValidEmail("@nolocal.com")).toBe(false);
    expect(isValidEmail("two@@at.com")).toBe(false);
    expect(isValidEmail("has space@x.com")).toBe(false);
  });
});
