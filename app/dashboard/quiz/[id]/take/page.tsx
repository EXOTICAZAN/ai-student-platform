import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import TakeQuizClient from "@/components/quiz/TakeQuizClient";
import QuizNotFound from "@/components/quiz/QuizNotFound";
import type { QuizQuestionRow, QuizRow } from "@/lib/study/types";

export const metadata = { title: "Take quiz — EduForge AI" };

interface Props {
  params: Promise<{ id: string }>;
}

export default async function TakeQuizPage({ params }: Props) {
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

  const { data: questionData } = await supabase
    .from("quiz_questions")
    .select("*")
    .eq("quiz_id", id)
    .eq("user_id", user.id)
    .order("position", { ascending: true });

  const questions = (questionData ?? []) as QuizQuestionRow[];

  if (questions.length === 0) {
    return (
      <QuizNotFound
        title="This quiz has no questions yet"
        description="Open the quiz and use “Regenerate questions” to create a fresh set with AI."
      />
    );
  }

  return <TakeQuizClient quiz={quizData as QuizRow} questions={questions} />;
}
