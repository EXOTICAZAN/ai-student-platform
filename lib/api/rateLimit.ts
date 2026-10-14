import { NextResponse } from "next/server";

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

// Each distinct user adds an entry, so the map is unbounded without this.
// Sweeping on growth keeps it proportional to active users, not lifetime users.
const MAX_BUCKETS = 10_000;

function sweep(now: number) {
  if (buckets.size < MAX_BUCKETS) return;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

/**
 * In-memory fixed window. Per server instance, so on a multi-instance
 * deployment it bounds abuse per instance rather than globally.
 */
export function consumeMemory(
  scope: string,
  identity: string,
  max: number,
  windowMs = 60_000,
  now = Date.now()
): RateResult {
  const key = `${scope}:${identity}`;

  sweep(now);

  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true };
  }

  if (bucket.count >= max) {
    return { ok: false, retryAfterMs: bucket.resetAt - now };
  }

  bucket.count += 1;
  return { ok: true };
}

/**
 * Shared fixed window on Upstash Redis (REST), used when
 * UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are set. INCR creates
 * the key at 1; PEXPIRE ... NX sets the window only on the first hit, and PTTL
 * reports what is left of it.
 */
async function consumeUpstash(
  url: string,
  token: string,
  scope: string,
  identity: string,
  max: number,
  windowMs: number
): Promise<RateResult> {
  const key = `rl:${scope}:${identity}`;

  const res = await fetch(`${url.replace(/\/$/, "")}/pipeline`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify([
      ["INCR", key],
      ["PEXPIRE", key, String(windowMs), "NX"],
      ["PTTL", key],
    ]),
    signal: AbortSignal.timeout(1500),
  });

  if (!res.ok) throw new Error(`Upstash responded ${res.status}`);

  const out = (await res.json()) as Array<{ result?: number; error?: string }>;
  const count = Number(out[0]?.result);
  const ttl = Number(out[2]?.result);

  if (!Number.isFinite(count)) throw new Error("Unexpected Upstash reply");

  if (count > max) {
    return { ok: false, retryAfterMs: ttl > 0 ? ttl : windowMs };
  }
  return { ok: true };
}

export type RateResult = { ok: true } | { ok: false; retryAfterMs: number };

/**
 * Fixed-window rate limit. Uses Upstash Redis when configured, so the limit is
 * global across instances; otherwise (and if Redis is unreachable) it falls
 * back to the per-instance in-memory counter, so a Redis outage degrades the
 * limit rather than taking the endpoints down.
 */
export async function consume(
  scope: string,
  identity: string,
  max: number,
  windowMs = 60_000
): Promise<RateResult> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (url && token) {
    try {
      return await consumeUpstash(url, token, scope, identity, max, windowMs);
    } catch (error) {
      console.error("Rate limiter fell back to memory:", error);
    }
  }

  return consumeMemory(scope, identity, max, windowMs);
}

/** 429 response for a failed `await consume()`, with a Retry-After the client can honour. */
export function tooManyRequests(retryAfterMs: number) {
  const seconds = Math.max(1, Math.ceil(retryAfterMs / 1000));
  return NextResponse.json(
    {
      data: null,
      error: {
        code: "rate_limited",
        message: `Too many requests. Try again in ${seconds}s.`,
      },
    },
    { status: 429, headers: { "Retry-After": String(seconds) } }
  );
}

/**
 * Convenience for cheap read/write routes: returns a 429 response when the
 * caller is over the limit, or null to continue.
 */
export async function limitOrNull(
  scope: string,
  identity: string,
  max: number,
  windowMs = 60_000
): Promise<NextResponse | null> {
  const result = await consume(scope, identity, max, windowMs);
  return result.ok ? null : tooManyRequests(result.retryAfterMs);
}
