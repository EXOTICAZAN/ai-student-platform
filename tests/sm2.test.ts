import { describe, expect, it } from "vitest";
import { applyGrade, intervalLabel, dueLabel } from "@/components/flashcards/sm2";

const NOW = new Date("2026-01-01T00:00:00.000Z");
const fresh = { ease: 2.5, interval_days: 0, reviews: 0, lapses: 0 };

describe("applyGrade", () => {
  it("again resets the interval, counts a lapse and lowers ease", () => {
    const r = applyGrade({ ease: 2.5, interval_days: 10, reviews: 4, lapses: 0 }, "again", NOW);
    expect(r.interval_days).toBe(0);
    expect(r.lapses).toBe(1);
    expect(r.ease).toBeCloseTo(2.3);
    expect(r.reviews).toBe(5);
  });

  it("never lets ease drop below 1.3", () => {
    let state = { ease: 1.35, interval_days: 5, reviews: 0, lapses: 0 };
    for (let i = 0; i < 5; i++) state = applyGrade(state, "again", NOW);
    expect(state.ease).toBe(1.3);
  });

  it("good on a new card schedules 1 day, then multiplies by ease", () => {
    const first = applyGrade(fresh, "good", NOW);
    expect(first.interval_days).toBe(1);
    const second = applyGrade(first, "good", NOW);
    expect(second.interval_days).toBe(Math.round(1 * first.ease));
  });

  it("easy is longer than good and raises ease", () => {
    const state = { ease: 2.5, interval_days: 4, reviews: 2, lapses: 0 };
    const good = applyGrade(state, "good", NOW);
    const easy = applyGrade(state, "easy", NOW);
    expect(easy.interval_days).toBeGreaterThan(good.interval_days);
    expect(easy.ease).toBeGreaterThan(state.ease);
  });

  it("hard grows the interval by at least one day", () => {
    const r = applyGrade({ ease: 2.5, interval_days: 0, reviews: 0, lapses: 0 }, "hard", NOW);
    expect(r.interval_days).toBeGreaterThanOrEqual(1);
  });

  it("sets due_at from the interval", () => {
    const r = applyGrade({ ease: 2.5, interval_days: 2, reviews: 1, lapses: 0 }, "good", NOW);
    const days = (new Date(r.due_at).getTime() - NOW.getTime()) / 86_400_000;
    expect(days).toBe(r.interval_days);
    expect(r.last_reviewed_at).toBe(NOW.toISOString());
  });
});

describe("labels", () => {
  it("formats intervals", () => {
    expect(intervalLabel(0)).toBe("soon");
    expect(intervalLabel(1)).toBe("1 day");
    expect(intervalLabel(9)).toBe("9 days");
    expect(intervalLabel(65)).toBe("2 months");
  });

  it("formats due dates", () => {
    const now = NOW.getTime();
    expect(dueLabel(new Date(now - 1000).toISOString(), now)).toBe("Due now");
    expect(dueLabel(new Date(now + 3 * 3_600_000).toISOString(), now)).toBe("Due in 3h");
    expect(dueLabel(new Date(now + 2 * 86_400_000).toISOString(), now)).toBe("Due in 2d");
    expect(dueLabel("not a date", now)).toBe("");
  });
});
