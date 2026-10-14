export type DueBucket =
  | "overdue"
  | "today"
  | "tomorrow"
  | "week"
  | "later"
  | "none";

const DAY_MS = 86_400_000;

export function parseDate(iso: string | null | undefined): Date | null {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function diffDays(a: Date, b: Date): number {
  return Math.round((a.getTime() - b.getTime()) / DAY_MS);
}

export function isSameLocalDay(
  iso: string | null | undefined,
  ref: Date = new Date()
): boolean {
  const d = parseDate(iso);
  if (!d) return false;
  return diffDays(startOfDay(d), startOfDay(ref)) === 0;
}

export function isOverdue(
  iso: string | null | undefined,
  status: string,
  now: Date = new Date()
): boolean {
  if (status === "done") return false;
  const d = parseDate(iso);
  if (!d) return false;
  return d.getTime() < now.getTime();
}

export function dueBucket(
  iso: string | null | undefined,
  status: string,
  now: Date = new Date()
): DueBucket {
  const d = parseDate(iso);
  if (!d) return "none";
  if (status !== "done" && d.getTime() < now.getTime()) return "overdue";
  const diff = diffDays(startOfDay(d), startOfDay(now));
  if (diff === 0) return "today";
  if (diff === 1) return "tomorrow";
  if (diff <= 6) return "week";
  return "later";
}

export function formatDue(iso: string | null | undefined): string {
  const d = parseDate(iso);
  if (!d) return "No date";
  const now = new Date();
  const diff = diffDays(startOfDay(d), startOfDay(now));
  const time = d.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
  if (diff === 0) return `Today · ${time}`;
  if (diff === 1) return `Tomorrow · ${time}`;
  if (diff === -1) return `Yesterday · ${time}`;
  const date = d.toLocaleDateString(undefined, {
    weekday: diff > 1 && diff < 7 ? "long" : undefined,
    month: "short",
    day: "numeric",
  });
  return `${date} · ${time}`;
}

/** ISO -> local "YYYY-MM-DDTHH:mm" for <input type="datetime-local">. */
export function toDateTimeLocal(iso: string | null | undefined): string {
  const d = parseDate(iso);
  if (!d) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
    `T${pad(d.getHours())}:${pad(d.getMinutes())}`
  );
}

/** datetime-local value -> UTC ISO, guarding against invalid input. */
export function fromDateTimeLocal(value: string): string | null {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}
