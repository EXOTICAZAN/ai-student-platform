import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import QuizDetailClient from "@/components/quiz/QuizDetailClient";
import QuizNotFound from "@/components/quiz/QuizNotFound";
import type { QuizAttemptRow, QuizQuestionRow, QuizRow } from "@/lib/study/types";

export const metadata = { title: "Quiz — EduForge AI" };

interface Props {
  params: Promise<{ id: string }>;
}

export default async function QuizDetailPage({ params }: Props) {
  const { id } = await params;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: quizData } = await supabase
    .from("quizzes")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!quizData) return <QuizNotFound />;

  const [{ data: questionData }, { data: attemptData }] = await Promise.all([
    supabase
      .from("quiz_questions")
      .select("*")
      .eq("quiz_id", id)
      .eq("user_id", user.id)
      .order("position", { ascending: true }),
    supabase
      .from("quiz_attempts")
      .select("*")
      .eq("quiz_id", id)
      .eq("user_id", user.id)
      .order("completed_at", { ascending: false })
      .limit(100),
  ]);

  return (
    <QuizDetailClient
      quiz={quizData as QuizRow}
      questions={(questionData ?? []) as QuizQuestionRow[]}
      attempts={(attemptData ?? []) as QuizAttemptRow[]}
    />
  );
}
