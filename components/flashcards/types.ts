import type { FlashcardDeckRow } from "@/lib/study/types";

export interface DeckWithStats extends FlashcardDeckRow {
  card_count: number;
  due_count: number;
}

export interface NoteOption {
  id: string;
  title: string;
  subject: string | null;
}
