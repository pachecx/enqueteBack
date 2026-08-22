import { describe, expect, it } from "vitest";
import { daysInMonth, dateKey } from "../src/utils/dates.js";

describe("calendar dates", () => {
  it("handles February in a normal year", () =>
    expect(daysInMonth(2, 2025)).toBe(28));
  it("handles leap years", () => expect(daysInMonth(2, 2024)).toBe(29));
  it("handles 30 and 31 day months", () => {
    expect(daysInMonth(4, 2026)).toBe(30);
    expect(daysInMonth(8, 2026)).toBe(31);
  });
  it("formats stable database date keys", () =>
    expect(dateKey(2026, 8, 5)).toBe("2026-08-05"));
  it("rejects invalid months", () =>
    expect(() => daysInMonth(13, 2026)).toThrow());
});
