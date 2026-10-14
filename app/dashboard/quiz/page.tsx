import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import QuizLibraryClient, {
  type QuizSummary,
} from "@/components/quiz/QuizLibraryClient";
import type { QuizRow } from "@/lib/study/types";

export const metadata = { title: "Quizzes — EduForge AI" };

interface Props {
  searchParams: Promise<{ noteId?: string }>;
}

export default async function QuizLibraryPage({ searchParams }: Props) {
  const { noteId } = await searchParams;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [{ data: quizData }, { data: attemptData }, { data: noteData }] =
    await Promise.all([
      supabase
        .from("quizzes")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(200),
      supabase
        .from("quiz_attempts")
        .select("quiz_id, score, total")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(2000),
      supabase
        .from("notes")
        .select("id, title, subject")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false })
        .limit(100),
    ]);

  const attempts = (attemptData ?? []) as {
    quiz_id: string;
    score: number;
    total: number;
  }[];

  const stats = new Map<string, { count: number; best: number | null; latest: number | null }>();
  for (const attempt of attempts) {
    const pct =
      attempt.total > 0 ? Math.round((attempt.score / attempt.total) * 100) : 0;
    const entry = stats.get(attempt.quiz_id) ?? { count: 0, best: null, latest: null };

    entry.count += 1;
    entry.best = entry.best === null ? pct : Math.max(entry.best, pct);
    // Attempts arrive newest-first, so the first one seen is the latest.
    if (entry.latest === null) entry.latest = pct;

    stats.set(attempt.quiz_id, entry);
  }

  const quizzes: QuizSummary[] = ((quizData ?? []) as QuizRow[]).map((quiz) => {
    const entry = stats.get(quiz.id);
    return {
      ...quiz,
      attempt_count: entry?.count ?? 0,
      best_percent: entry?.best ?? null,
      latest_percent: entry?.latest ?? null,
    };
  });

  const notes = (noteData ?? []) as {
    id: string;
    title: string;
    subject: string | null;
  }[];

  const initialNoteId =
    noteId && notes.some((n) => n.id === noteId) ? noteId : null;

  return (
    <QuizLibraryClient quizzes={quizzes} notes={notes} initialNoteId={initialNoteId} />
  );
}
