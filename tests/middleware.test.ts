import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { isDocumentRequest } from "@/lib/supabase/middleware";

function request(path: string, init: ConstructorParameters<typeof Request>[1] = {}) {
  return new NextRequest(new Request(`https://eduforge.test${path}`, init));
}

describe("Supabase request-boundary refresh", () => {
  it("refreshes a normal HTML navigation", () => {
    expect(isDocumentRequest(request("/dashboard", {
      headers: { accept: "text/html,application/xhtml+xml" },
    }))).toBe(true);
  });

  it("does not refresh parallel API requests", () => {
    expect(isDocumentRequest(request("/api/notifications", {
      headers: { accept: "application/json" },
    }))).toBe(false);
  });

  it("does not refresh RSC requests or router prefetches", () => {
    expect(isDocumentRequest(request("/dashboard", {
      headers: { accept: "text/x-component", rsc: "1" },
    }))).toBe(false);
    expect(isDocumentRequest(request("/dashboard", {
      headers: { accept: "text/html", purpose: "prefetch" },
    }))).toBe(false);
  });

  it("does not refresh mutations", () => {
    expect(isDocumentRequest(request("/dashboard", {
      method: "POST",
      headers: { accept: "text/html" },
    }))).toBe(false);
  });
});
