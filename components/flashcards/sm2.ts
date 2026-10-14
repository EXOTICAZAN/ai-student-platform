export type Grade = "again" | "hard" | "good" | "easy";

export interface ScheduleState {
  ease: number;
  interval_days: number;
  reviews: number;
  lapses: number;
}

export interface ScheduleResult extends ScheduleState {
  due_at: string;
  last_reviewed_at: string;
}

const DAY_MS = 86_400_000;
const MIN_EASE = 1.3;

export function applyGrade(
  state: ScheduleState,
  grade: Grade,
  now: Date = new Date()
): ScheduleResult {
  let ease = state.ease;
  let interval = state.interval_days;
  let lapses = state.lapses;

  switch (grade) {
    case "again":
      interval = 0;
      lapses += 1;
      ease = Math.max(MIN_EASE, ease - 0.2);
      break;
    case "hard":
      interval = Math.max(1, Math.round(interval * 1.2));
      ease = Math.max(MIN_EASE, ease - 0.15);
      break;
    case "good":
      interval = interval === 0 ? 1 : Math.round(interval * ease);
      break;
    case "easy":
      interval = Math.round((interval === 0 ? 3 : interval * ease) * 1.3);
      ease += 0.15;
      break;
  }

  return {
    ease,
    interval_days: interval,
    reviews: state.reviews + 1,
    lapses,
    due_at: new Date(now.getTime() + interval * DAY_MS).toISOString(),
    last_reviewed_at: now.toISOString(),
  };
}

export function intervalLabel(days: number): string {
  if (days <= 0) return "soon";
  if (days === 1) return "1 day";
  if (days < 30) return `${days} days`;
  const months = Math.round(days / 30);
  return months <= 1 ? "1 month" : `${months} months`;
}

const HOUR_MS = 3_600_000;

export function dueLabel(iso: string, now: number = Date.now()): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";

  const diff = then - now;
  if (diff <= 0) return "Due now";
  if (diff < DAY_MS) return `Due in ${Math.max(1, Math.round(diff / HOUR_MS))}h`;
  return `Due in ${Math.round(diff / DAY_MS)}d`;
}
