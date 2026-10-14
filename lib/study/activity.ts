import { createClient } from "@/lib/supabase/server";
import type {
  ActivityType,
  DashboardStats,
  NotificationRow,
  WeeklyMinutes,
} from "@/lib/study/types";
import { EMPTY_STATS } from "@/lib/study/types";

// =============================================================
// Activity / XP / notification helpers.
//
// Every feature records what the user did here. The dashboard
// stat cards, streak, level and analytics all read back from
// activity_log, so they can never drift from real behaviour.
//
// Logging must never break the operation that triggered it, so
// these helpers swallow their own errors.
// =============================================================

/** XP awarded per action type. */
export const XP = {
  note_created: 15,
  note_ai_generated: 25,
  deck_created: 20,
  card_reviewed: 2,
  quiz_created: 20,
  quiz_completed: 40,
  quiz_perfect_bonus: 25,
  task_created: 5,
  task_completed: 30,
  tutor_message: 5,
  profile_completed: 50,
} as const;

export interface LogActivityParams {
  type: ActivityType;
  label: string;
  xp?: number;
  /** Extra data. `minutes` is summed by the study-time charts. */
  metadata?: Record<string, unknown>;
  /** When set, also creates a notification for the user. */
  notify?: { text: string; link?: string };
}

/**
 * Records one activity row (and optionally a notification) for the
 * currently authenticated user. No-op when there is no session.
 */
export async function logActivity(
  params: LogActivityParams
): Promise<void> {
  const { type, label, xp = 0, metadata = {}, notify } = params;

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    await supabase.from("activity_log").insert({
      user_id: user.id,
      activity_type: type,
      label,
      xp,
      metadata,
    });

    if (notify) {
      await supabase.from("notifications").insert({
        user_id: user.id,
        text: notify.text,
        link: notify.link ?? null,
      });
    }
  } catch (error) {
    console.error("[activity] failed to log:", error);
  }
}

const FALLBACK_STATS: typeof EMPTY_STATS = {
  total_xp: 0,
  level: 1,
  streak_days: 0,
  ai_usage: 0,
  notes_count: 0,
  decks_count: 0,
  cards_due: 0,
  tasks_done: 0,
  tasks_open: 0,
  quizzes_taken: 0,
  avg_accuracy: 0,
  minutes_this_week: 0,
};

/** Aggregated dashboard stats for a user, or safe zeroes. */
export async function getDashboardStats(
  userId: string
): Promise<DashboardStats> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc(
      "get_user_dashboard_stats",
      { target_user_id: userId }
    );

    if (error || !data) {
      console.error("[activity] stats rpc failed:", error?.message);
      return FALLBACK_STATS;
    }

    const row = (Array.isArray(data) ? data[0] : data) as DashboardStats;
    if (!row) return FALLBACK_STATS;

    return {
      ...FALLBACK_STATS,
      ...row,
      total_xp: Number(row.total_xp ?? 0),
      avg_accuracy: Number(row.avg_accuracy ?? 0),
    };
  } catch (error) {
    console.error("[activity] stats error:", error);
    return FALLBACK_STATS;
  }
}

const EMPTY_WEEK: WeeklyMinutes[] = Array.from({ length: 7 }, (_, i) => ({
  day: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][i],
  day_index: i,
  minutes: 0,
  xp: 0,
  events: 0,
}));

/** Last 7 days of study minutes, always length 7. */
export async function getWeeklyMinutes(
  userId: string
): Promise<WeeklyMinutes[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("get_weekly_study_minutes", {
      target_user_id: userId,
    });

    if (error || !Array.isArray(data) || data.length === 0) {
      if (error) {
        console.error("[activity] weekly rpc failed:", error.message);
      }
      return EMPTY_WEEK;
    }

    return data.map((row: WeeklyMinutes, i: number) => ({
      day: row.day ?? EMPTY_WEEK[i]?.day ?? "",
      day_index: row.day_index ?? i,
      minutes: Number(row.minutes ?? 0),
      xp: Number(row.xp ?? 0),
      events: Number(row.events ?? 0),
    }));
  } catch (error) {
    console.error("[activity] weekly error:", error);
    return EMPTY_WEEK;
  }
}

export interface RecentActivityItem {
  id: string;
  user_id: string;
  activity_type: ActivityType;
  label: string;
  xp: number;
  created_at: string;
}

/** Most recent activity rows for the dashboard feed. */
export async function getRecentActivity(
  userId: string,
  limit = 6
): Promise<RecentActivityItem[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("activity_log")
    .select("id, user_id, activity_type, label, xp, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  return (data ?? []) as RecentActivityItem[];
}

/** Unread-first notifications for the top nav bell. */
export async function getNotifications(
  userId: string,
  limit = 10
): Promise<NotificationRow[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  return data ?? [];
}
