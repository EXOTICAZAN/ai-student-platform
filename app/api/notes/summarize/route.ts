import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { summarizeContent } from "@/lib/study/generate";
import { readJson, serverError } from "@/lib/api/guard";
import { consume, tooManyRequests } from "@/lib/api/rateLimit";

// =============================================================
// POST /api/notes/summarize
// Condenses a note body (or arbitrary text) into 2-3 sentences.
// When noteId is supplied the summary is persisted on the row.
// =============================================================

interface Body {
  noteId?: string;
  content?: string;
  persist?: boolean;
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
    const limit = await consume("notes_summarize", user.id, 10);
    if (!limit.ok) return tooManyRequests(limit.retryAfterMs);

    const body = await readJson<Body>(request);

    if (!body) {
      return NextResponse.json(
        { data: null, error: { code: "bad_request", message: "Invalid JSON body." } },
        { status: 400 }
      );
    }

    let content = body.content?.trim() ?? "";

    if (body.noteId) {
      const { data: note } = await supabase
        .from("notes")
        .select("id, content, user_id")
        .eq("id", body.noteId)
        .eq("user_id", user.id)
        .single();

      if (!note) {
        return NextResponse.json(
          { data: null, error: { code: "not_found", message: "Note not found." } },
          { status: 404 }
        );
      }

      content = note.content?.trim() ?? "";
    }

    if (content.length < 40) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: "bad_request",
            message: "There is not enough content to summarise yet.",
          },
        },
        { status: 400 }
      );
    }

    const summary = await summarizeContent(content);

    if (!summary) {
      return NextResponse.json(
        {
          data: null,
          error: { code: "empty_response", message: "The model returned no summary." },
        },
        { status: 502 }
      );
    }

    // Persist by default when we were given a note to summarise.
    if (body.noteId && body.persist !== false) {
      await supabase
        .from("notes")
        .update({ summary })
        .eq("id", body.noteId)
        .eq("user_id", user.id);
    }

    return NextResponse.json({ data: { summary }, error: null });
  } catch (error) {
    return serverError("/api/notes/summarize", error, "Failed to summarise.");
  }
}
