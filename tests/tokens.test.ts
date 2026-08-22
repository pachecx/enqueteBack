import { describe, expect, it } from "vitest";
import { createToken, hashToken } from "../src/utils/tokens.js";

describe("anonymous participant tokens", () => {
  it("generates unpredictable url-safe tokens", () => {
    const token = createToken();
    expect(token).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(token.length).toBeGreaterThan(30);
  });
  it("hashes consistently without storing the raw token", () => {
    const token = createToken();
    expect(hashToken(token)).toBe(hashToken(token));
    expect(hashToken(token)).not.toBe(token);
  });
  it("generates distinct tokens", () =>
    expect(createToken()).not.toBe(createToken()));
});
