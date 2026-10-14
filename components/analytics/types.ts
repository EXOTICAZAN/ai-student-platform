import type {
  ActivityType,
  DashboardStats,
  TaskStatus,
  WeeklyMinutes,
} from "@/lib/study/types";

export type RangeDays = 7 | 30 | 90;

/** One UTC calendar day of aggregated activity_log data. */
export interface DailyActivity {
  date: string;
  xp: number;
  minutes: number;
  events: number;
  types: Partial<Record<ActivityType, number>>;
}

export interface SubjectAttempt {
  subject: string | null;
  score: number;
  total: number;
  completed_at: string;
}

export interface TaskDatum {
  title: string;
  subject: string | null;
  status: TaskStatus;
  duration_minutes: number;
  created_at: string;
  due_at: string | null;
  completed_at: string | null;
}

export interface FlashcardSummary {
  total: number;
  due: number;
  reviews: number;
  lapses: number;
  buckets: { label: string; count: number }[];
}

export interface AnalyticsData {
  stats: DashboardStats;
  weekly: WeeklyMinutes[];
  dailyGoalMinutes: number;
  minutesLastWeek: number;
  daily: DailyActivity[];
  attempts: SubjectAttempt[];
  tasks: TaskDatum[];
  flashcards: FlashcardSummary;
}
