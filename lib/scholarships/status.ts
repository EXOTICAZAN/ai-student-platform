/**
 * Scholarship status is stored when a row is compiled, but a deadline passing
 * does not update the row. Trusting the stored value means a scholarship whose
 * deadline was months ago is still listed as "open". Status is therefore
 * derived from the deadline at read time.
 */

interface HasStatus {
  status: string;
  application_deadline: string | null;
}

/** A stored "closed" always wins; otherwise a passed deadline means closed. */
export function effectiveStatus(
  status: string,
  deadline: string | null | undefined,
  now: Date = new Date()
): string {
  if (status === "closed") return "closed";
  if (!deadline) return status;

  const time = new Date(deadline).getTime();
  if (Number.isNaN(time)) return status;

  return time < now.getTime() ? "closed" : status;
}

export function withEffectiveStatus<T extends HasStatus>(
  row: T,
  now: Date = new Date()
): T {
  return {
    ...row,
    status: effectiveStatus(row.status, row.application_deadline, now),
  };
}

/**
 * PostgREST `or=` clause that mirrors effectiveStatus() so the status filter
 * agrees with the badge shown on each card.
 */
export function statusFilterClause(
  status: string,
  now: Date = new Date()
): { eq?: string; or: string } {
  const iso = now.toISOString();
  const notPassed = `application_deadline.is.null,application_deadline.gte.${iso}`;

  if (status === "closed") {
    return { or: `status.eq.closed,application_deadline.lt.${iso}` };
  }
  return { eq: status, or: notPassed };
}
