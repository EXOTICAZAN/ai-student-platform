import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateQuiz } from "@/lib/study/generate";
import { createQuiz } from "@/app/dashboard/quiz/actions";
import type { QuizDifficulty } from "@/lib/study/types";
import { consume, tooManyRequests } from "@/lib/api/rateLimit";

// =============================================================
// POST /api/quiz/generate
//
// Writes a multiple-choice quiz with the AI model from a topic or from
// one of the user's notes, persists the quiz + its questions, and
// returns the created quiz row so the client can navigate to it.
// =============================================================

const MAX_TOPIC_LENGTH = 400;
const DIFFICULTIES: QuizDifficulty[] = ["easy", "medium", "hard", "mixed"];

interface GenerateBody {
  topic?: string;
  subject?: string;
  noteId?: string;
  count?: number | string;
  difficulty?: string;
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const user = session?.user;

    if (!user) {
      return NextResponse.json(
        { data: null, error: { code: "unauthorized", message: "Sign in required." } },
        { status: 401 }
      );
    }

    // Every request here costs real tokens, so cap the loop before it starts.
    const limit = await consume("quiz_generate", user.id, 10);
    if (!limit.ok) return tooManyRequests(limit.retryAfterMs);

    let body: GenerateBody;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { data: null, error: { code: "bad_request", message: "Invalid JSON body." } },
        { status: 400 }
      );
    }

    const topic = body.topic?.trim().slice(0, MAX_TOPIC_LENGTH) || undefined;
    const subject = body.subject?.trim() || undefined;

    const rawCount = Number(body.count);
    const count = Number.isFinite(rawCount)
      ? Math.min(Math.max(Math.round(rawCount), 3), 25)
      : 8;

    const difficulty: QuizDifficulty = DIFFICULTIES.includes(
      body.difficulty as QuizDifficulty
    )
      ? (body.difficulty as QuizDifficulty)
      : "mixed";

    let source: string | undefined;
    let noteId: string | null = null;
    let noteTopic: string | undefined;
    let noteSubject: string | undefined;

    if (body.noteId) {
      const { data: note } = await supabase
        .from("notes")
        .select("id, title, subject, content")
        .eq("id", body.noteId)
        .eq("user_id", user.id)
        .single();

      if (!note || !note.content?.trim()) {
        return NextResponse.json(
          {
            data: null,
            error: {
              code: "not_found",
              message: "That note was not found or has no content yet.",
            },
          },
          { status: 404 }
        );
      }

      source = note.content;
      noteId = note.id;
      noteTopic = note.title;
      noteSubject = note.subject ?? undefined;
    } else if (!topic) {
      return NextResponse.json(
        {
          data: null,
          error: { code: "bad_request", message: "A topic or a note is required." },
        },
        { status: 400 }
      );
    }

    const generated = await generateQuiz({
      topic: topic ?? noteTopic,
      subject: subject ?? noteSubject,
      source,
      count,
      difficulty,
    });

    const created = await createQuiz({
      title: generated.title,
      subject: generated.subject || subject || noteSubject || null,
      topic: topic ?? noteTopic ?? null,
      difficulty,
      note_id: noteId,
      questions: generated.questions,
    });

    if (!created.ok || !created.data) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: "persist_failed",
            message: created.error ?? "Generated the quiz but could not save it.",
          },
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: created.data, error: null });
  } catch (error) {
    console.error("/api/quiz/generate CRASH:", error);

    const message =
      "Failed to generate the quiz.";

    return NextResponse.json(
      { data: null, error: { code: "server_error", message } },
      { status: 500 }
    );
  }
}
