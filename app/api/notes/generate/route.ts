import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  generateNoteFromSource,
  generateNoteFromTopic,
} from "@/lib/study/generate";
import { logActivity, XP } from "@/lib/study/activity";
import type { GeneratedNote } from "@/lib/study/types";
import { consume, tooManyRequests } from "@/lib/api/rateLimit";

// =============================================================
// POST /api/notes/generate
//
// Generates study notes with the AI model from one of three sources:
//   topic    — write notes about a subject from scratch
//   text     — condense pasted material
//   document — condense an already-ingested PDF (RAG chunks)
//
// With `save: true` the result is persisted to `notes` and the
// row is returned, so the client can navigate straight to it.
// =============================================================

const MAX_TOPIC_LENGTH = 400;

interface GenerateBody {
  mode?: "topic" | "text" | "document";
  topic?: string;
  subject?: string;
  text?: string;
  documentId?: string;
  depth?: "concise" | "standard" | "deep";
  save?: boolean;
}

async function loadDocumentSource(
  userId: string,
  documentId: string
): Promise<{ source: string; fileName: string } | null> {
  const supabase = await createClient();

  const { data: doc } = await supabase
    .from("documents")
    .select("id, file_name, user_id")
    .eq("id", documentId)
    .eq("user_id", userId)
    .single();

  if (!doc) return null;

  const { data: chunks } = await supabase
    .from("document_chunks")
    .select("content, chunk_index")
    .eq("document_id", documentId)
    .eq("user_id", userId)
    .order("chunk_index", { ascending: true })
    .limit(60);

  const source = (chunks ?? [])
    .map((c: { content: string }) => c.content)
    .join("\n\n")
    .trim();

  if (!source) return null;

  return { source, fileName: doc.file_name ?? "document" };
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
    const limit = await consume("notes_generate", user.id, 10);
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

    const mode = body.mode ?? "topic";
    const subject = body.subject?.trim() || undefined;

    let note: GeneratedNote;

    if (mode === "topic") {
      const topic = body.topic?.trim();
      if (!topic) {
        return NextResponse.json(
          { data: null, error: { code: "bad_request", message: "A topic is required." } },
          { status: 400 }
        );
      }

      note = await generateNoteFromTopic({
        topic: topic.slice(0, MAX_TOPIC_LENGTH),
        subject,
        depth: body.depth ?? "standard",
      });
    } else if (mode === "text") {
      const text = body.text?.trim();
      if (!text || text.length < 40) {
        return NextResponse.json(
          {
            data: null,
            error: {
              code: "bad_request",
              message: "Paste at least 40 characters of source material.",
            },
          },
          { status: 400 }
        );
      }

      note = await generateNoteFromSource({
        source: text,
        topic: body.topic?.trim(),
        subject,
        sourceType: "text",
      });
    } else if (mode === "document") {
      if (!body.documentId) {
        return NextResponse.json(
          { data: null, error: { code: "bad_request", message: "A documentId is required." } },
          { status: 400 }
        );
      }

      const loaded = await loadDocumentSource(user.id, body.documentId);
      if (!loaded) {
        return NextResponse.json(
          {
            data: null,
            error: {
              code: "not_found",
              message:
                "That document has no processed text yet. Upload it again and wait for processing to finish.",
            },
          },
          { status: 404 }
        );
      }

      note = await generateNoteFromSource({
        source: loaded.source,
        topic: body.topic?.trim() ?? loaded.fileName,
        subject,
        sourceType: "pdf",
      });
    } else {
      return NextResponse.json(
        { data: null, error: { code: "bad_request", message: "Unknown mode." } },
        { status: 400 }
      );
    }

    if (!note.content) {
      return NextResponse.json(
        {
          data: null,
          error: { code: "empty_response", message: "The model returned no content. Try again." },
        },
        { status: 502 }
      );
    }

    if (!body.save) {
      return NextResponse.json({ data: note, error: null });
    }

    const { data: row, error: insertError } = await supabase
      .from("notes")
      .insert({
        user_id: user.id,
        title: note.title,
        content: note.content,
        summary: note.summary || null,
        subject: note.subject || subject || null,
        tags: note.tags,
        source_type: mode === "document" ? "pdf" : "ai",
        document_id: mode === "document" ? body.documentId : null,
      })
      .select()
      .single();

    if (insertError || !row) {
      return NextResponse.json(
        {
          data: note,
          error: {
            code: "persist_failed",
            message: insertError?.message ?? "Generated the note but could not save it.",
          },
        },
        { status: 500 }
      );
    }

    await logActivity({
      type: "note",
      label: `Generated note · ${note.title}`,
      xp: XP.note_ai_generated,
      metadata: { note_id: row.id, subject: row.subject, mode },
    });

    return NextResponse.json({ data: { ...note, id: row.id }, error: null });
  } catch (error) {
    console.error("/api/notes/generate CRASH:", error);

    const message =
      "Failed to generate notes.";

    return NextResponse.json(
      { data: null, error: { code: "server_error", message } },
      { status: 500 }
    );
  }
}
