import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getDashboardStats, getWeeklyMinutes } from "@/lib/study/activity";
import AnalyticsClient from "@/components/analytics/AnalyticsClient";
import type {
  AnalyticsData,
  DailyActivity,
  FlashcardSummary,
  SubjectAttempt,
  TaskDatum,
} from "@/components/analytics/types";
import type { ActivityType } from "@/lib/study/types";

export const metadata = { title: "Analytics — EduForge AI" };

const DAY_MS = 86_400_000;

const ACTIVITY_TYPES: ActivityType[] = [
  "note",
  "flashcard",
  "quiz",
  "task",
  "tutor",
  "scholarship",
  "profile",
];

interface ActivityLite {
  activity_type: ActivityType;
  xp: number | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

interface AttemptLite {
  score: number | null;
  total: number | null;
  completed_at: string;
  quizzes: { subject: string | null } | { subject: string | null }[] | null;
}

interface FlashcardLite {
  interval_days: number | null;
  reviews: number | null;
  lapses: number | null;
  due_at: string;
}

const INTERVAL_BUCKETS: { label: string; test: (days: number) => boolean }[] = [
  { label: "0", test: (d) => d <= 0 },
  { label: "1–3", test: (d) => d >= 1 && d <= 3 },
  { label: "4–7", test: (d) => d >= 4 && d <= 7 },
  { label: "8–30", test: (d) => d >= 8 && d <= 30 },
  { label: "30+", test: (d) => d > 30 },
];

export default async function AnalyticsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // One clock read for the whole page so every window agrees on "now".
  // This is a server component, so reading the clock here is safe.
  // eslint-disable-next-line react-hooks/purity
  const now = Date.now();
  const since = new Date(now - 90 * DAY_MS).toISOString();

  const [
    profileRes,
    stats,
    weekly,
    settingsRes,
    activityRes,
    attemptsRes,
    tasksRes,
    cardsRes,
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("full_name, email")
      .eq("id", user.id)
      .maybeSingle(),
    getDashboardStats(user.id),
    getWeeklyMinutes(user.id),
    supabase
      .from("user_settings")
      .select("daily_goal_minutes")
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("activity_log")
      .select("activity_type, xp, metadata, created_at")
      .eq("user_id", user.id)
      .gte("created_at", since)
      .order("created_at", { ascending: true })
      .limit(5000),
    supabase
      .from("quiz_attempts")
      .select("score, total, completed_at, quizzes(subject)")
      .eq("user_id", user.id)
      .gte("completed_at", since)
      .order("completed_at", { ascending: false })
      .limit(500),
    supabase
      .from("study_tasks")
      .select(
        "title, subject, status, duration_minutes, created_at, due_at, completed_at"
      )
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(500),
    supabase
      .from("flashcards")
      .select("interval_days, reviews, lapses, due_at")
      .eq("user_id", user.id)
      .limit(5000),
  ]);

  const dailyMap = new Map<string, DailyActivity>();
  for (const row of (activityRes.data ?? []) as ActivityLite[]) {
    const key = row.created_at.slice(0, 10);
    let entry = dailyMap.get(key);
    if (!entry) {
      entry = { date: key, xp: 0, minutes: 0, events: 0, types: {} };
      dailyMap.set(key, entry);
    }
    entry.xp += Number(row.xp ?? 0);
    const mins = Number(row.metadata?.minutes ?? 0);
    if (Number.isFinite(mins) && mins > 0) entry.minutes += mins;
    entry.events += 1;
    if (ACTIVITY_TYPES.includes(row.activity_type)) {
      entry.types[row.activity_type] = (entry.types[row.activity_type] ?? 0) + 1;
    }
  }
  const daily = Array.from(dailyMap.values()).sort((a, b) =>
    a.date.localeCompare(b.date)
  );

  const lastWeekStart = new Date(now - 13 * DAY_MS)
    .toISOString()
    .slice(0, 10);
  const lastWeekEnd = new Date(now - 7 * DAY_MS)
    .toISOString()
    .slice(0, 10);
  let minutesLastWeek = 0;
  for (const d of daily) {
    if (d.date >= lastWeekStart && d.date <= lastWeekEnd) {
      minutesLastWeek += d.minutes;
    }
  }

  const attempts: SubjectAttempt[] = ((attemptsRes.data ?? []) as AttemptLite[]).map(
    (a) => {
      const quiz = Array.isArray(a.quizzes) ? a.quizzes[0] : a.quizzes;
      return {
        subject: quiz?.subject ?? null,
        score: Number(a.score ?? 0),
        total: Number(a.total ?? 0),
        completed_at: a.completed_at,
      };
    }
  );

  const cards = (cardsRes.data ?? []) as FlashcardLite[];
  const flashcards: FlashcardSummary = {
    total: cards.length,
    due: cards.filter((c) => new Date(c.due_at).getTime() <= now).length,
    reviews: cards.reduce((s, c) => s + Number(c.reviews ?? 0), 0),
    lapses: cards.reduce((s, c) => s + Number(c.lapses ?? 0), 0),
    buckets: INTERVAL_BUCKETS.map((b) => ({
      label: b.label,
      count: cards.filter((c) => b.test(Number(c.interval_days ?? 0))).length,
    })),
  };

  const profile = profileRes.data as
    | { full_name: string | null; email: string | null }
    | null;
  const settings = settingsRes.data as { daily_goal_minutes: number | null } | null;

  const data: AnalyticsData = {
    stats,
    weekly,
    dailyGoalMinutes: Number(settings?.daily_goal_minutes ?? 60),
    minutesLastWeek,
    daily,
    attempts,
    tasks: (tasksRes.data ?? []) as TaskDatum[],
    flashcards,
  };

  return (
    <AnalyticsClient
      data={data}
      userName={profile?.full_name || user.email?.split("@")[0] || "Learner"}
      userEmail={profile?.email ?? user.email ?? ""}
    />
  );
}
