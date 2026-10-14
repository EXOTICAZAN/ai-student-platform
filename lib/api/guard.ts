import { NextResponse } from "next/server";

/**
 * Number(...) of a query param yields NaN for `?page=abc`, and NaN propagates
 * into `.range()` as a PostgREST error rather than a validation failure.
 */
export function clampInt(
  raw: string | null,
  min: number,
  max: number,
  fallback: number
): number {
  // Number(null) and Number("") are 0, which would clamp a missing parameter
  // to `min` instead of using the default.
  if (raw === null || raw.trim() === "") return fallback;

  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, Math.trunc(parsed)));
}

/** Parses a JSON body, returning null instead of throwing on malformed input. */
export async function readJson<T>(request: Request): Promise<T | null> {
  try {
    return (await request.json()) as T;
  } catch {
    return null;
  }
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_RE.test(value);
}

/**
 * Upstream messages (Postgres constraints, Groq SDK internals, missing env
 * vars) are logged in full but never returned: they name tables, columns and
 * configuration that a client has no business seeing.
 */
export function serverError(
  context: string,
  error: unknown,
  fallback: string,
  code = "server_error"
) {
  console.error(`${context}:`, error);
  return NextResponse.json(
    { data: null, error: { code, message: fallback } },
    { status: 500 }
  );
}
