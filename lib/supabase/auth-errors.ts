const INVALID_SESSION_PATTERNS = [
  /invalid[_\s-]*refresh[_\s-]*token/i,
  /refresh token.*already used/i,
  /authrefreshdiscardederror/i,
  /session.*(expired|not found|invalid)/i,
];

/** True for errors that mean the browser's persisted session cannot be reused. */
export function isInvalidSessionError(error: unknown): boolean {
  const message =
    typeof error === "string"
      ? error
      : error && typeof error === "object"
        ? [
            "message" in error ? (error as { message?: unknown }).message : "",
            "name" in error ? (error as { name?: unknown }).name : "",
            "code" in error ? (error as { code?: unknown }).code : "",
          ].join(" ")
        : "";
  return INVALID_SESSION_PATTERNS.some((pattern) => pattern.test(message));
}
