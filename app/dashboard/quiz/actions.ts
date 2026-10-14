"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { generateQuiz } from "@/lib/study/generate";
import { logActivity, XP } from "@/lib/study/activity";
import type {
  ActionResult,
  GeneratedQuestion,
  QuizAttemptRow,
  QuizDifficulty,
  QuizQuestionRow,
  QuizRow,
} from "@/lib/study/types";
import { actionAllowed, ACTION_LIMIT_ERROR } from "@/lib/api/actionLimit";

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { supabase, user };
}

async function insertQuestions(
  supabase: SupabaseClient,
  quizId: string,
  userId: string,
  questions: GeneratedQuestion[]
) {
  return supabase.from("quiz_questions").insert(
    questions.map((q, i) => ({
      quiz_id: quizId,
      user_id: userId,
      question: q.question,
      options: q.options,
      correct_index: q.correct_index,
      explanation: q.explanation || null,
      position: i,
    }))
  ).select();
}

export interface CreateQuizInput {
  title: string;
  subject?: string | null;
  topic?: string | null;
  difficulty?: QuizDifficulty;
  note_id?: string | null;
  questions: GeneratedQuestion[];
}

export async function createQuiz(
  input: CreateQuizInput
): Promise<ActionResult<QuizRow>> {
  const { supabase, user } = await requireUser();
  if (!user) return { ok: false, error: "You must be signed in." };
  if (!(await actionAllowed("quiz", user.id))) return { ok: false, error: ACTION_LIMIT_ERROR };

  const title = input.title?.trim();
  if (!title) return { ok: false, error: "A title is required." };
  if (!input.questions?.length) {
    return { ok: false, error: "At least one question is required." };
  }

  const { data, error } = await supabase
    .from("quizzes")
    .insert({
      user_id: user.id,
      title,
      subject: input.subject?.trim() || null,
      topic: input.topic?.trim() || null,
      difficulty: input.difficulty ?? "mixed",
      question_count: input.questions.length,
      note_id: input.note_id ?? null,
    })
    .select()
    .single();

  if (error || !data) {
    console.error("[quiz] create failed:", error?.message);
    return { ok: false, error: "Could not create the quiz." };
  }

  const { error: questionsError } = await insertQuestions(
    supabase,
    data.id,
    user.id,
    input.questions
  );

  if (questionsError) {
    console.error("[quiz] question insert failed:", questionsError.message);
    await supabase.from("quizzes").delete().eq("id", data.id).eq("user_id", user.id);
    return { ok: false, error: questionsError.message };
  }

  revalidatePath("/dashboard/quiz");

  await logActivity({
    type: "quiz",
    label: `Created quiz · ${title}`,
    xp: XP.quiz_created,
    metadata: {
      quiz_id: data.id,
      difficulty: data.difficulty,
      question_count: data.question_count,
    },
  });

  return { ok: true, data: data as QuizRow };
}

export async function deleteQuiz(quizId: string): Promise<ActionResult> {
  const { supabase, user } = await requireUser();
  if (!user) return { ok: false, error: "You must be signed in." };
  if (!(await actionAllowed("quiz", user.id))) return { ok: false, error: ACTION_LIMIT_ERROR };

  const { error } = await supabase
    .from("quizzes")
    .delete()
    .eq("id", quizId)
    .eq("user_id", user.id);

  if (error) {
    console.error("[quiz] delete failed:", error.message);
    return { ok: false, error: "Could not delete the quiz." };
  }

  revalidatePath("/dashboard/quiz");
  revalidatePath(`/dashboard/quiz/${quizId}`);
  return { ok: true };
}

export async function regenerateQuestions(
  quizId: string
): Promise<ActionResult<QuizQuestionRow[]>> {
  const { supabase, user } = await requireUser();
  if (!user) return { ok: false, error: "You must be signed in." };
  if (!(await actionAllowed("quiz", user.id))) return { ok: false, error: ACTION_LIMIT_ERROR };

  const { data: quizRow } = await supabase
    .from("quizzes")
    .select("*")
    .eq("id", quizId)
    .eq("user_id", user.id)
    .single();

  if (!quizRow) return { ok: false, error: "Quiz not found." };
  const quiz = quizRow as QuizRow;

  let source: string | undefined;
  if (quiz.note_id) {
    const { data: note } = await supabase
      .from("notes")
      .select("content")
      .eq("id", quiz.note_id)
      .eq("user_id", user.id)
      .single();

    if (note?.content?.trim()) source = note.content;
  }

  let questions: GeneratedQuestion[];
  try {
    const generated = await generateQuiz({
      topic: quiz.topic ?? quiz.title,
      subject: quiz.subject ?? undefined,
      source,
      count: quiz.question_count || 8,
      difficulty: quiz.difficulty,
    });
    questions = generated.questions;
  } catch (error) {
    console.error("[quiz] regenerate failed:", error);
    return {
      ok: false,
      error:
        "Could not regenerate questions.",
    };
  }

  const { error: deleteError } = await supabase
    .from("quiz_questions")
    .delete()
    .eq("quiz_id", quizId)
    .eq("user_id", user.id);

  if (deleteError) {
    console.error("[quiz] clearing old questions failed:", deleteError.message);
    return { ok: false, error: deleteError.message };
  }

  const { data: rows, error: insertError } = await insertQuestions(
    supabase,
    quizId,
    user.id,
    questions
  );

  if (insertError || !rows) {
    console.error("[quiz] question insert failed:", insertError?.message);
    return {
      ok: false,
      error: insertError?.message ?? "Could not save the new questions.",
    };
  }

  const { error: updateError } = await supabase
    .from("quizzes")
    .update({ question_count: rows.length, updated_at: new Date().toISOString() })
    .eq("id", quizId)
    .eq("user_id", user.id);

  if (updateError) {
    console.error("[quiz] quiz update failed:", updateError.message);
    return { ok: false, error: updateError.message };
  }

  revalidatePath("/dashboard/quiz");
  revalidatePath(`/dashboard/quiz/${quizId}`);

  return { ok: true, data: rows as QuizQuestionRow[] };
}

export interface SaveAttemptResult {
  attempt: QuizAttemptRow;
  xp: number;
}

export async function saveAttempt(
  quizId: string,
  answers: (number | null)[],
  score: number,
  total: number
): Promise<ActionResult<SaveAttemptResult>> {
  const { supabase, user } = await requireUser();
  if (!user) return { ok: false, error: "You must be signed in." };
  if (!(await actionAllowed("quiz", user.id))) return { ok: false, error: ACTION_LIMIT_ERROR };

  if (
    !Array.isArray(answers) ||
    !Number.isInteger(total) ||
    total <= 0 ||
    answers.length !== total ||
    !Number.isInteger(score) ||
    score < 0 ||
    score > total
  ) {
    return { ok: false, error: "Malformed attempt payload." };
  }

  const { data: quizRow } = await supabase
    .from("quizzes")
    .select("id, title")
    .eq("id", quizId)
    .eq("user_id", user.id)
    .single();

  if (!quizRow) return { ok: false, error: "Quiz not found." };

  const { data, error } = await supabase
    .from("quiz_attempts")
    .insert({ quiz_id: quizId, user_id: user.id, answers, score, total })
    .select()
    .single();

  if (error || !data) {
    console.error("[quiz] save attempt failed:", error?.message);
    return { ok: false, error: "Could not save the attempt." };
  }

  const perfect = score === total;
  const xp = XP.quiz_completed + (perfect ? XP.quiz_perfect_bonus : 0);
  const pct = Math.round((score / total) * 100);

  revalidatePath("/dashboard/quiz");
  revalidatePath(`/dashboard/quiz/${quizId}`);

  await logActivity({
    type: "quiz",
    label: `Completed quiz · ${quizRow.title} — ${score}/${total} (${pct}%)`,
    xp,
    metadata: { quiz_id: quizId, score, total, percent: pct, perfect },
    ...(perfect
      ? {
          notify: {
            text: `Perfect score on “${quizRow.title}”! +${XP.quiz_perfect_bonus} bonus XP.`,
            link: `/dashboard/quiz/${quizId}`,
          },
        }
      : {}),
  });

  return { ok: true, data: { attempt: data as QuizAttemptRow, xp } };
}

export async function deleteAttempt(attemptId: string): Promise<ActionResult> {
  const { supabase, user } = await requireUser();
  if (!user) return { ok: false, error: "You must be signed in." };
  if (!(await actionAllowed("quiz", user.id))) return { ok: false, error: ACTION_LIMIT_ERROR };

  const { data: deleted, error } = await supabase
    .from("quiz_attempts")
    .delete()
    .eq("id", attemptId)
    .eq("user_id", user.id)
    .select("quiz_id");

  if (error) {
    console.error("[quiz] delete attempt failed:", error.message);
    return { ok: false, error: "Could not delete the attempt." };
  }

  const quizId = (deleted as { quiz_id: string }[] | null)?.[0]?.quiz_id;
  revalidatePath("/dashboard/quiz");
  if (quizId) revalidatePath(`/dashboard/quiz/${quizId}`);

  return { ok: true };
}
