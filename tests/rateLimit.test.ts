import { afterEach, describe, expect, it, vi } from "vitest";
import { consume, consumeMemory } from "@/lib/api/rateLimit";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("consumeMemory", () => {
  it("allows up to max, then blocks with a retry time", () => {
    const t = 1_000_000;
    for (let i = 0; i < 3; i++) {
      expect(consumeMemory("t1", "u", 3, 60_000, t).ok).toBe(true);
    }
    const blocked = consumeMemory("t1", "u", 3, 60_000, t + 10_000);
    expect(blocked.ok).toBe(false);
    if (!blocked.ok) expect(blocked.retryAfterMs).toBe(50_000);
  });

  it("resets after the window", () => {
    const t = 2_000_000;
    consumeMemory("t2", "u", 1, 1_000, t);
    expect(consumeMemory("t2", "u", 1, 1_000, t + 500).ok).toBe(false);
    expect(consumeMemory("t2", "u", 1, 1_000, t + 1_001).ok).toBe(true);
  });

  it("keeps scopes and identities separate", () => {
    const t = 3_000_000;
    expect(consumeMemory("a", "u1", 1, 60_000, t).ok).toBe(true);
    expect(consumeMemory("a", "u2", 1, 60_000, t).ok).toBe(true);
    expect(consumeMemory("b", "u1", 1, 60_000, t).ok).toBe(true);
    expect(consumeMemory("a", "u1", 1, 60_000, t).ok).toBe(false);
  });
});

describe("consume (Upstash)", () => {
  function stubUpstash(count: number, ttl: number) {
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "https://redis.example");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "token");
    const fetchMock = vi.fn(async () =>
      new Response(
        JSON.stringify([{ result: count }, { result: 1 }, { result: ttl }]),
        { status: 200 }
      )
    );
    vi.stubGlobal("fetch", fetchMock);
    return fetchMock;
  }

  it("allows when the shared counter is within the limit", async () => {
    stubUpstash(2, 30_000);
    expect((await consume("u-ok", "x", 5)).ok).toBe(true);
  });

  it("blocks with the remaining TTL when over the limit", async () => {
    const fetchMock = stubUpstash(6, 12_000);
    const result = await consume("u-over", "x", 5);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.retryAfterMs).toBe(12_000);
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it("falls back to memory if Redis is unreachable", async () => {
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "https://redis.example");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "token");
    vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("down"); }));
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect((await consume("u-fallback", "x", 1)).ok).toBe(true);
    expect((await consume("u-fallback", "x", 1)).ok).toBe(false);
  });
});
