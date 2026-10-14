import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import DecksClient from "@/components/flashcards/DecksClient";
import type {
  DeckWithStats,
  NoteOption,
} from "@/components/flashcards/types";
import type { FlashcardDeckRow } from "@/lib/study/types";

export const metadata = { title: "Flashcards — EduForge AI" };

interface Props {
  searchParams: Promise<{ noteId?: string }>;
}

interface CardRef {
  id: string;
  deck_id: string;
  due_at: string;
}

function buildDeckStats(cards: CardRef[] | null) {
  const now = Date.now();
  const stats = new Map<string, { total: number; due: number }>();

  for (const card of cards ?? []) {
    const entry = stats.get(card.deck_id) ?? { total: 0, due: 0 };
    entry.total += 1;
    if (new Date(card.due_at).getTime() <= now) entry.due += 1;
    stats.set(card.deck_id, entry);
  }

  return stats;
}

export default async function FlashcardsPage({ searchParams }: Props) {
  const { noteId } = await searchParams;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [{ data: decks }, { data: cards }, { data: notes }] = await Promise.all([
    supabase
      .from("flashcard_decks")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(200),
    supabase
      .from("flashcards")
      .select("id, deck_id, due_at")
      .eq("user_id", user.id)
      .limit(5000),
    supabase
      .from("notes")
      .select("id, title, subject")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(100),
  ]);

  const stats = buildDeckStats((cards ?? []) as CardRef[]);

  const decksWithStats: DeckWithStats[] = ((decks ?? []) as FlashcardDeckRow[]).map(
    (deck) => ({
      ...deck,
      card_count: stats.get(deck.id)?.total ?? 0,
      due_count: stats.get(deck.id)?.due ?? 0,
    })
  );

  return (
    <DecksClient
      decks={decksWithStats}
      notes={(notes ?? []) as NoteOption[]}
      initialNoteId={noteId}
    />
  );
}
