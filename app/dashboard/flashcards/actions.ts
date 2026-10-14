"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { logActivity, XP } from "@/lib/study/activity";
import { generateFlashcards } from "@/lib/study/generate";
import { applyGrade, type Grade } from "@/components/flashcards/sm2";
import type {
  ActionResult,
  FlashcardDeckRow,
  FlashcardRow,
} from "@/lib/study/types";
import { actionAllowed, ACTION_LIMIT_ERROR } from "@/lib/api/actionLimit";

// =============================================================
// Flashcards — mutations.
// Returns an ActionResult envelope so the UI can toast real
// errors instead of failing silently.
// =============================================================

export interface DeckInput {
  title: string;
  subject?: string | null;
  description?: string | null;
  note_id?: string | null;
}

export interface CardInput {
  front: string;
  back: string;
  hint?: string | null;
}

export interface GenerateDeckInput {
  topic?: string;
  subject?: string;
  noteId?: string;
  count?: number;
}

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { supabase, user };
}

export async function createDeck(
  input: DeckInput
): Promise<ActionResult<FlashcardDeckRow>> {
  const { supabase, user } = await requireUser();
  if (!user) return { ok: false, error: "You must be signed in." };
  if (!(await actionAllowed("flashcards", user.id))) return { ok: false, error: ACTION_LIMIT_ERROR };

  const title = input.title?.trim();
  if (!title) return { ok: false, error: "A title is required." };

  const { data, error } = await supabase
    .from("flashcard_decks")
    .insert({
      user_id: user.id,
      title,
      subject: input.subject?.trim() || null,
      description: input.description?.trim() || null,
      note_id: input.note_id ?? null,
    })
    .select()
    .single();

  if (error || !data) {
    console.error("[flashcards] create deck failed:", error?.message);
    return { ok: false, error: "Could not create the deck." };
  }

  revalidatePath("/dashboard/flashcards");

  await logActivity({
    type: "flashcard",
    label: `Created deck · ${title}`,
    xp: XP.deck_created,
    metadata: { deck_id: data.id, subject: data.subject },
  });

  return { ok: true, data };
}

export async function updateDeck(
  deckId: string,
  patch: Partial<Pick<FlashcardDeckRow, "title" | "subject" | "description">>
): Promise<ActionResult<FlashcardDeckRow>> {
  const { supabase, user } = await requireUser();
  if (!user) return { ok: false, error: "You must be signed in." };
  if (!(await actionAllowed("flashcards", user.id))) return { ok: false, error: ACTION_LIMIT_ERROR };

  const payload: Record<string, unknown> = {};
  if (patch.title !== undefined) {
    const title = patch.title.trim();
    if (!title) return { ok: false, error: "A title is required." };
    payload.title = title;
  }
  if (patch.subject !== undefined) payload.subject = patch.subject?.trim() || null;
  if (patch.description !== undefined)
    payload.description = patch.description?.trim() || null;

  const { data, error } = await supabase
    .from("flashcard_decks")
    .update(payload)
    .eq("id", deckId)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error || !data) {
    console.error("[flashcards] update deck failed:", error?.message);
    return { ok: false, error: "Could not save the deck." };
  }

  revalidatePath("/dashboard/flashcards");
  revalidatePath(`/dashboard/flashcards/${deckId}`);

  return { ok: true, data };
}

export async function deleteDeck(deckId: string): Promise<ActionResult> {
  const { supabase, user } = await requireUser();
  if (!user) return { ok: false, error: "You must be signed in." };
  if (!(await actionAllowed("flashcards", user.id))) return { ok: false, error: ACTION_LIMIT_ERROR };

  const { error } = await supabase
    .from("flashcard_decks")
    .delete()
    .eq("id", deckId)
    .eq("user_id", user.id);

  if (error) {
    console.error("[flashcards] delete deck failed:", error.message);
    return { ok: false, error: "Could not delete the deck." };
  }

  revalidatePath("/dashboard/flashcards");
  revalidatePath(`/dashboard/flashcards/${deckId}`);

  return { ok: true };
}

export async function addCard(
  deckId: string,
  input: CardInput
): Promise<ActionResult<FlashcardRow>> {
  const { supabase, user } = await requireUser();
  if (!user) return { ok: false, error: "You must be signed in." };
  if (!(await actionAllowed("flashcards", user.id))) return { ok: false, error: ACTION_LIMIT_ERROR };

  const front = input.front?.trim();
  const back = input.back?.trim();
  if (!front || !back)
    return { ok: false, error: "Both sides of the card are required." };

  const { data: deck } = await supabase
    .from("flashcard_decks")
    .select("id")
    .eq("id", deckId)
    .eq("user_id", user.id)
    .single();

  if (!deck) return { ok: false, error: "Deck not found." };

  const { data, error } = await supabase
    .from("flashcards")
    .insert({
      deck_id: deckId,
      user_id: user.id,
      front,
      back,
      hint: input.hint?.trim() || null,
    })
    .select()
    .single();

  if (error || !data) {
    console.error("[flashcards] add card failed:", error?.message);
    return { ok: false, error: "Could not add the card." };
  }

  revalidatePath(`/dashboard/flashcards/${deckId}`);

  return { ok: true, data };
}

export async function updateCard(
  cardId: string,
  patch: Partial<Pick<FlashcardRow, "front" | "back" | "hint">>
): Promise<ActionResult<FlashcardRow>> {
  const { supabase, user } = await requireUser();
  if (!user) return { ok: false, error: "You must be signed in." };
  if (!(await actionAllowed("flashcards", user.id))) return { ok: false, error: ACTION_LIMIT_ERROR };

  const payload: Record<string, unknown> = {};
  if (patch.front !== undefined) {
    const front = patch.front.trim();
    if (!front) return { ok: false, error: "The front side is required." };
    payload.front = front;
  }
  if (patch.back !== undefined) {
    const back = patch.back.trim();
    if (!back) return { ok: false, error: "The back side is required." };
    payload.back = back;
  }
  if (patch.hint !== undefined) payload.hint = patch.hint?.trim() || null;

  const { data, error } = await supabase
    .from("flashcards")
    .update(payload)
    .eq("id", cardId)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error || !data) {
    console.error("[flashcards] update card failed:", error?.message);
    return { ok: false, error: "Could not save the card." };
  }

  revalidatePath(`/dashboard/flashcards/${data.deck_id}`);

  return { ok: true, data };
}

export async function deleteCard(cardId: string): Promise<ActionResult> {
  const { supabase, user } = await requireUser();
  if (!user) return { ok: false, error: "You must be signed in." };
  if (!(await actionAllowed("flashcards", user.id))) return { ok: false, error: ACTION_LIMIT_ERROR };

  const { data, error } = await supabase
    .from("flashcards")
    .delete()
    .eq("id", cardId)
    .eq("user_id", user.id)
    .select("deck_id")
    .single();

  if (error || !data) {
    console.error("[flashcards] delete card failed:", error?.message);
    return { ok: false, error: "Could not delete the card." };
  }

  revalidatePath(`/dashboard/flashcards/${data.deck_id}`);

  return { ok: true };
}

export async function gradeCard(
  cardId: string,
  grade: Grade
): Promise<ActionResult<{ card: FlashcardRow; xp: number }>> {
  const { supabase, user } = await requireUser();
  if (!user) return { ok: false, error: "You must be signed in." };
  if (!(await actionAllowed("flashcards", user.id))) return { ok: false, error: ACTION_LIMIT_ERROR };

  const { data: existing } = await supabase
    .from("flashcards")
    .select("*")
    .eq("id", cardId)
    .eq("user_id", user.id)
    .single();

  if (!existing) return { ok: false, error: "Card not found." };

  const schedule = applyGrade(existing as FlashcardRow, grade);

  const { data, error } = await supabase
    .from("flashcards")
    .update({
      ease: schedule.ease,
      interval_days: schedule.interval_days,
      reviews: schedule.reviews,
      lapses: schedule.lapses,
      due_at: schedule.due_at,
      last_reviewed_at: schedule.last_reviewed_at,
    })
    .eq("id", cardId)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error || !data) {
    console.error("[flashcards] grade failed:", error?.message);
    return { ok: false, error: "Could not save the review." };
  }

  revalidatePath(`/dashboard/flashcards/${data.deck_id}`);
  revalidatePath(`/dashboard/flashcards/${data.deck_id}/study`);

  await logActivity({
    type: "flashcard",
    label: `Reviewed card · ${data.front.slice(0, 60)}`,
    xp: XP.card_reviewed,
    metadata: { card_id: data.id, deck_id: data.deck_id, grade },
  });

  return { ok: true, data: { card: data, xp: XP.card_reviewed } };
}

export async function generateDeckFromAI(
  input: GenerateDeckInput
): Promise<ActionResult<FlashcardDeckRow>> {
  const { supabase, user } = await requireUser();
  if (!user) return { ok: false, error: "You must be signed in." };
  if (!(await actionAllowed("flashcards", user.id))) return { ok: false, error: ACTION_LIMIT_ERROR };

  const topic = input.topic?.trim() || undefined;
  const subject = input.subject?.trim() || undefined;

  let source: string | undefined;
  let noteId: string | null = null;
  let noteTitle: string | undefined;

  if (input.noteId) {
    const { data: note } = await supabase
      .from("notes")
      .select("id, title, content")
      .eq("id", input.noteId)
      .eq("user_id", user.id)
      .single();

    if (!note) return { ok: false, error: "That note does not exist." };

    source = note.content;
    noteId = note.id;
    noteTitle = note.title;
  }

  if (!source && !topic)
    return { ok: false, error: "Enter a topic or choose a note." };

  let cards;
  try {
    cards = await generateFlashcards({
      topic,
      subject,
      source,
      count: input.count,
    });
  } catch (error) {
    console.error("[flashcards] generation failed:", error);
    return {
      ok: false,
      error: "Generation failed.",
    };
  }

  if (cards.length === 0)
    return { ok: false, error: "The model returned no cards. Try again." };

  const title = (topic ?? noteTitle ?? "AI deck").slice(0, 200);

  const { data: deck, error: deckError } = await supabase
    .from("flashcard_decks")
    .insert({
      user_id: user.id,
      title,
      subject: subject ?? null,
      description: source
        ? `AI-generated from note · ${noteTitle ?? "Untitled"}`
        : "AI-generated deck",
      note_id: noteId,
    })
    .select()
    .single();

  if (deckError || !deck) {
    console.error("[flashcards] create generated deck failed:", deckError?.message);
    return {
      ok: false,
      error: deckError?.message ?? "Could not create the deck.",
    };
  }

  const { error: cardsError } = await supabase.from("flashcards").insert(
    cards.map((c) => ({
      deck_id: deck.id,
      user_id: user.id,
      front: c.front,
      back: c.back,
      hint: c.hint ?? null,
    }))
  );

  if (cardsError) {
    console.error("[flashcards] insert generated cards failed:", cardsError.message);
    return {
      ok: false,
      error: `Created the deck but could not save the cards: ${cardsError.message}`,
    };
  }

  revalidatePath("/dashboard/flashcards");

  await logActivity({
    type: "flashcard",
    label: `Generated deck · ${title}`,
    xp: XP.deck_created,
    metadata: { deck_id: deck.id, cards: cards.length, subject },
  });

  return { ok: true, data: deck };
}
