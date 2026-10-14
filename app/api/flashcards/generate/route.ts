import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateFlashcards } from "@/lib/study/generate";
import { logActivity, XP } from "@/lib/study/activity";
import type { FlashcardDeckRow, FlashcardRow } from "@/lib/study/types";
import { consume, tooManyRequests } from "@/lib/api/rateLimit";

// =============================================================
// POST /api/flashcards/generate
//
// Generates spaced-repetition cards with the AI model from one of:
//   topic  — write cards about a subject from scratch
//   noteId — derive cards from an existing note's content
//   source — derive cards from raw pasted text
//
// With `deckId` the cards are appended to an existing deck;
// without one a new deck is created and returned alongside.
// =============================================================

interface GenerateBody {
  deckId?: string;
  topic?: string;
  subject?: string;
  noteId?: string;
  source?: string;
  count?: number;
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { data: null, error: { code: "unauthorized", message: "Sign in required." } },
        { status: 401 }
      );
    }

    // Every request here costs real tokens, so cap the loop before it starts.
    const limit = await consume("flashcards_generate", user.id, 10);
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

    const topic = body.topic?.trim().slice(0, 400) || undefined;
    const subject = body.subject?.trim().slice(0, 120) || undefined;
    let source = body.source?.trim() || undefined;
    let noteId: string | null = null;
    let noteTitle: string | undefined;

    if (body.noteId) {
      const { data: note } = await supabase
        .from("notes")
        .select("id, title, content")
        .eq("id", body.noteId)
        .eq("user_id", user.id)
        .single();

      if (!note) {
        return NextResponse.json(
          { data: null, error: { code: "not_found", message: "That note does not exist." } },
          { status: 404 }
        );
      }

      source = note.content;
      noteId = note.id;
      noteTitle = note.title;
    }

    if (!source && !topic) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: "bad_request",
            message: "A topic, source, or noteId is required.",
          },
        },
        { status: 400 }
      );
    }

    const count = Math.min(Math.max(Math.round(Number(body.count) || 12), 4), 30);

    const cards = await generateFlashcards({ topic, subject, source, count });

    if (cards.length === 0) {
      return NextResponse.json(
        {
          data: null,
          error: { code: "empty_response", message: "The model returned no cards. Try again." },
        },
        { status: 502 }
      );
    }

    let deck: FlashcardDeckRow;
    let createdDeck = false;

    if (body.deckId) {
      const { data } = await supabase
        .from("flashcard_decks")
        .select("*")
        .eq("id", body.deckId)
        .eq("user_id", user.id)
        .single();

      if (!data) {
        return NextResponse.json(
          { data: null, error: { code: "not_found", message: "Deck not found." } },
          { status: 404 }
        );
      }

      deck = data as FlashcardDeckRow;
    } else {
      const { data, error } = await supabase
        .from("flashcard_decks")
        .insert({
          user_id: user.id,
          title: (topic ?? noteTitle ?? "AI deck").slice(0, 200),
          subject: subject ?? null,
          note_id: noteId,
        })
        .select()
        .single();

      if (error || !data) {
        return NextResponse.json(
          {
            data: null,
            error: {
              code: "persist_failed",
              message: "Could not create the deck.",
            },
          },
          { status: 500 }
        );
      }

      deck = data as FlashcardDeckRow;
      createdDeck = true;
    }

    const { data: rows, error: insertError } = await supabase
      .from("flashcards")
      .insert(
        cards.map((c) => ({
          deck_id: deck.id,
          user_id: user.id,
          front: c.front,
          back: c.back,
          hint: c.hint ?? null,
        }))
      )
      .select();

    if (insertError || !rows) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: "persist_failed",
            message: insertError?.message ?? "Generated the cards but could not save them.",
          },
        },
        { status: 500 }
      );
    }

    await logActivity({
      type: "flashcard",
      label: createdDeck
        ? `Generated deck · ${deck.title}`
        : `Generated ${rows.length} cards · ${deck.title}`,
      xp: createdDeck ? XP.deck_created : 0,
      metadata: { deck_id: deck.id, cards: rows.length, note_id: noteId },
    });

    return NextResponse.json({
      data: { deckId: deck.id, cards: rows as FlashcardRow[] },
      error: null,
    });
  } catch (error) {
    console.error("/api/flashcards/generate CRASH:", error);

    const message =
      "Failed to generate flashcards.";

    return NextResponse.json(
      { data: null, error: { code: "server_error", message } },
      { status: 500 }
    );
  }
}
