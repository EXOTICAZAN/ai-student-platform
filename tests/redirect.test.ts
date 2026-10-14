import { describe, expect, it } from "vitest";
import { safeRedirectPath } from "@/lib/auth/redirect";

describe("safeRedirectPath", () => {
  it("keeps ordinary in-app paths", () => {
    expect(safeRedirectPath("/dashboard")).toBe("/dashboard");
    expect(safeRedirectPath("/dashboard/notes?tab=2")).toBe("/dashboard/notes?tab=2");
  });

  it("falls back for missing or relative values", () => {
    expect(safeRedirectPath(null)).toBe("/dashboard");
    expect(safeRedirectPath("")).toBe("/dashboard");
    expect(safeRedirectPath("dashboard")).toBe("/dashboard");
  });

  it("rejects protocol-relative and backslash open redirects", () => {
    expect(safeRedirectPath("//evil.com")).toBe("/dashboard");
    expect(safeRedirectPath("/\\evil.com")).toBe("/dashboard");
    expect(safeRedirectPath("/\\\\evil.com")).toBe("/dashboard");
    expect(safeRedirectPath("/\t/evil.com")).toBe("/dashboard");
    expect(safeRedirectPath("/\n/evil.com")).toBe("/dashboard");
  });

  it("rejects absolute URLs", () => {
    expect(safeRedirectPath("https://evil.com")).toBe("/dashboard");
  });
});
