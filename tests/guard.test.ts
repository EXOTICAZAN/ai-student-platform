import { describe, expect, it } from "vitest";
import { clampInt, isUuid, readJson } from "@/lib/api/guard";

describe("clampInt", () => {
  it("falls back for missing or non-numeric input", () => {
    expect(clampInt(null, 1, 50, 12)).toBe(12);
    expect(clampInt("abc", 1, 50, 12)).toBe(12);
    expect(clampInt("", 1, 50, 12)).toBe(12);
    expect(clampInt("   ", 1, 50, 12)).toBe(12);
  });

  it("clamps and truncates", () => {
    expect(clampInt("999", 1, 50, 12)).toBe(50);
    expect(clampInt("-5", 1, 50, 12)).toBe(1);
    expect(clampInt("7.9", 1, 50, 12)).toBe(7);
  });
});

describe("readJson", () => {
  it("rejects oversized JSON before parsing", async () => {
    const request = new Request("http://localhost", {
      method: "POST",
      body: JSON.stringify({ value: "x".repeat(300) }),
    });
    await expect(readJson(request, 100)).resolves.toBeNull();
  });

  it("parses valid JSON", async () => {
    const request = new Request("http://localhost", {
      method: "POST", body: JSON.stringify({ ok: true }),
    });
    await expect(readJson<{ ok: boolean }>(request)).resolves.toEqual({ ok: true });
  });
});

describe("isUuid", () => {
  it("accepts UUIDs and rejects everything else", () => {
    expect(isUuid("123e4567-e89b-12d3-a456-426614174000")).toBe(true);
    expect(isUuid("not-a-uuid")).toBe(false);
    expect(isUuid(undefined)).toBe(false);
    expect(isUuid("123e4567-e89b-12d3-a456-42661417400")).toBe(false);
  });
});
