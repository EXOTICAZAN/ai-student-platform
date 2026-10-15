import { afterEach, describe, expect, it, vi } from "vitest";
import { isInvalidSessionError } from "@/lib/supabase/auth-errors";
import { fetchNotifications } from "@/lib/notifications/client";

afterEach(() => vi.unstubAllGlobals());

describe("auth recovery helpers", () => {
  it("recognizes rotated and expired refresh-session failures", () => {
    expect(isInvalidSessionError(new Error("Invalid Refresh Token: Already Used"))).toBe(true);
    expect(isInvalidSessionError(new Error("AuthRefreshDiscardedError"))).toBe(true);
    expect(isInvalidSessionError(new Error("network unavailable"))).toBe(false);
  });
});

describe("notification request dedupe", () => {
  it("shares an in-flight authenticated request", async () => {
    let resolve!: (response: Response) => void;
    const request = new Promise<Response>((r) => { resolve = r; });
    const fetchMock = vi.fn(() => request);
    vi.stubGlobal("fetch", fetchMock);

    const first = fetchNotifications();
    const second = fetchNotifications();
    expect(first).toBe(second);
    expect(fetchMock).toHaveBeenCalledOnce();

    resolve(new Response(JSON.stringify({ data: { notifications: [], unread: 0 } })));
    await expect(first).resolves.toEqual({ notifications: [], unread: 0 });
  });
});
