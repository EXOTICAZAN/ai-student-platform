import { consume } from "@/lib/api/rateLimit";

/** Message returned by a server action that hit its per-user limit. */
export const ACTION_LIMIT_ERROR =
  "Too many requests. Please wait a moment and try again.";

/**
 * Per-user limit for server actions (they are POST endpoints too, so they need
 * the same protection as route handlers). Returns true when the call may run.
 */
export async function actionAllowed(
  scope: string,
  userId: string,
  max = 120
): Promise<boolean> {
  const result = await consume(`action:${scope}`, userId, max);
  return result.ok;
}
