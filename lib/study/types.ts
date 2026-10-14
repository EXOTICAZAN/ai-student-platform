// =============================================================
// EduForge AI — Study Feature Types
// Mirrors supabase/migrations/002_study_features.sql
// =============================================================

// ------------------------------------------------------------------
// Enums
// ------------------------------------------------------------------

export type TaskPriority = "low" | "medium" | "high";
export type TaskStatus = "todo" | "in_progress" | "done";
export type QuizDifficulty = "easy" | "medium" | "hard" | "mixed";
export type ActivityType =
  | "note"
  | "flashcard"
  | "quiz"
  | "task"
  | "tutor"
  | "scholarship"
  | "profile";

// ------------------------------------------------------------------
// Database rows
// ------------------------------------------------------------------

export interface NoteRow {
  id: string;
  user_id: string;
  title: string;
  content: string;
  summary: string | null;
  subject: string | null;
  tags: string[];
  source_type: "manual" | "ai" | "pdf";
  document_id: string | null;
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
}

export interface FlashcardDeckRow {
  id: string;
  user_id: string;
  title: string;
  subject: string | null;
  description: string | null;
  note_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface FlashcardRow {
  id: string;
  deck_id: string;
  user_id: string;
  front: string;
  back: string;
  hint: string | null;
  ease: number;
  interval_days: number;
  reviews: number;
  lapses: number;
  due_at: string;
  last_reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface QuizRow {
  id: string;
  user_id: string;
  title: string;
  subject: string | null;
  topic: string | null;
  difficulty: QuizDifficulty;
  question_count: number;
  note_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface QuizQuestionRow {
  id: string;
  quiz_id: string;
  user_id: string;
  question: string;
  options: string[];
  correct_index: number;
  explanation: string | null;
  position: number;
}

export interface QuizAttemptRow {
  id: string;
  quiz_id: string;
  user_id: string;
  answers: (number | null)[];
  score: number;
  total: number;
  completed_at: string;
  created_at: string;
}

export interface StudyTaskRow {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  subject: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  due_at: string | null;
  duration_minutes: number;
  completed_at: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface ActivityRow {
  id: string;
  user_id: string;
  activity_type: ActivityType;
  label: string;
  metadata: Record<string, unknown>;
  xp: number;
  created_at: string;
}

export interface NotificationRow {
  id: string;
  user_id: string;
  text: string;
  link: string | null;
  read: boolean;
  created_at: string;
}

export interface UserSettingsRow {
  id: string;
  user_id: string;
  theme: string;
  daily_goal_minutes: number;
  email_notifications: boolean;
  push_notifications: boolean;
  study_reminders: boolean;
  public_profile: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProfileRow {
  id: string;
  full_name: string | null;
  email: string | null;
  country: string | null;
  grade: string | null;
  learning_goal: string | null;
  target_degree: string | null;
  preferred_language: string | null;
  avatar_url: string | null;
  created_at: string | null;
  updated_at: string | null;
}

// ------------------------------------------------------------------
// RPC result shapes
// ------------------------------------------------------------------

/** Returned by get_user_dashboard_stats() */
export interface DashboardStats {
  total_xp: number;
  level: number;
  streak_days: number;
  ai_usage: number;
  notes_count: number;
  decks_count: number;
  cards_due: number;
  tasks_done: number;
  tasks_open: number;
  quizzes_taken: number;
  avg_accuracy: number;
  minutes_this_week: number;
}

/** Returned by get_weekly_study_minutes() */
export interface WeeklyMinutes {
  day: string;
  day_index: number;
  minutes: number;
  xp: number;
  events: number;
}

export const EMPTY_STATS: DashboardStats = {
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

// ------------------------------------------------------------------
// AI generation payloads
// ------------------------------------------------------------------

export interface GeneratedNote {
  title: string;
  subject: string;
  summary: string;
  content: string;
  tags: string[];
  key_points: string[];
}

export interface GeneratedFlashcard {
  front: string;
  back: string;
  hint?: string;
}

export interface GeneratedQuestion {
  question: string;
  options: string[];
  correct_index: number;
  explanation: string;
}

export interface GeneratedQuiz {
  title: string;
  subject: string;
  questions: GeneratedQuestion[];
}

export interface GeneratedTask {
  title: string;
  description: string;
  subject: string;
  priority: TaskPriority;
  duration_minutes: number;
  /** Days from today; 0 = today */
  offset_days: number;
}

// ------------------------------------------------------------------
// Server action result envelope
// ------------------------------------------------------------------

export interface ActionResult<T = undefined> {
  ok: boolean;
  data?: T;
  error?: string;
}

// ------------------------------------------------------------------
// Labels
// ------------------------------------------------------------------

export const PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

export const STATUS_LABELS: Record<TaskStatus, string> = {
  todo: "To do",
  in_progress: "In progress",
  done: "Done",
};

export const DIFFICULTY_LABELS: Record<QuizDifficulty, string> = {
  easy: "Easy",
  medium: "Medium",
  hard: "Hard",
  mixed: "Mixed",
};

export const ACTIVITY_META: Record<
  ActivityType,
  { label: string; icon: string; className: string }
> = {
  note: { label: "Note", icon: "NotebookPen", className: "text-emerald-400 bg-emerald-500/15" },
  flashcard: { label: "Flashcard", icon: "Layers", className: "text-purple-400 bg-purple-500/15" },
  quiz: { label: "Quiz", icon: "HelpCircle", className: "text-sky-400 bg-sky-500/15" },
  task: { label: "Task", icon: "CheckCircle2", className: "text-teal-400 bg-teal-500/15" },
  tutor: { label: "AI Tutor", icon: "MessageSquare", className: "text-indigo-400 bg-indigo-500/15" },
  scholarship: { label: "Scholarship", icon: "Trophy", className: "text-amber-400 bg-amber-500/15" },
  profile: { label: "Profile", icon: "User", className: "text-rose-400 bg-rose-500/15" },
};
