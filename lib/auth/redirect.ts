const PLACEHOLDER_ORIGIN = "https://eduforge.invalid";

/**
 * Accepts only same-origin, path-absolute redirects such as `/dashboard`.
 *
 * A simple "starts with / but not //" check is not enough: browsers treat a
 * backslash like a slash, so `/\evil.com` navigates to `//evil.com`, and
 * tabs or newlines inside the value are stripped before parsing. Resolving the
 * value against a placeholder origin and comparing origins catches all of
 * these, because any off-site target changes the origin.
 */
export function safeRedirectPath(value: string | null | undefined, fallback = "/dashboard"): string {
  if (!value || !value.startsWith("/")) return fallback;
  if (/[\\\x00-\x1f\x7f]/.test(value)) return fallback;

  try {
    const resolved = new URL(value, PLACEHOLDER_ORIGIN);
    if (resolved.origin !== PLACEHOLDER_ORIGIN) return fallback;
    return `${resolved.pathname}${resolved.search}${resolved.hash}`;
  } catch {
    return fallback;
  }
}
