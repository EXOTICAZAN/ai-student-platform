export type CourseSummary = { id: string; title: string; created_at: string };

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** Select only from the already user-owned course list; malformed or unknown IDs use the newest course. */
export function selectCourse<T extends CourseSummary>(courses: T[], requestedId?: string, createNew = false): T | null {
  if (createNew) return null;
  if (requestedId && UUID_RE.test(requestedId)) {
    const requested = courses.find((course) => course.id === requestedId);
    if (requested) return requested;
  }
  return courses[0] ?? null;
}
