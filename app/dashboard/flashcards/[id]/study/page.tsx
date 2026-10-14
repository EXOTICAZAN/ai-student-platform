import Link from "next/link";
import { redirect } from "next/navigation";
import { Layers } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import DashboardShell from "@/components/dashboard/DashboardShell";
import EmptyState from "@/components/ui/EmptyState";
import StudyClient from "@/components/flashcards/StudyClient";
import type { FlashcardDeckRow, FlashcardRow } from "@/lib/study/types";

export const metadata = { title: "Study — EduForge AI" };

interface Props {
  params: Promise<{ id: string }>;
}

export default async function StudyPage({ params }: Props) {
  const { id } = await params;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: deck } = await supabase
    .from("flashcard_decks")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!deck) {
    return (
      <DashboardShell>
        <div className="mx-auto max-w-3xl">
          <EmptyState
            icon={Layers}
            title="Deck not found"
            description="This deck does not exist or belongs to another account."
            action={
              <Link
                href="/dashboard/flashcards"
                className="inline-flex h-10 items-center rounded-xl border border-white/10 bg-white/5 px-4 text-sm font-medium text-slate-200 transition-all hover:border-white/20 hover:bg-white/10 hover:text-white"
              >
                Back to flashcards
              </Link>
            }
          />
        </div>
      </DashboardShell>
    );
  }

  const nowIso = new Date().toISOString();

  const { data: due } = await supabase
    .from("flashcards")
    .select("*")
    .eq("deck_id", id)
    .eq("user_id", user.id)
    .lte("due_at", nowIso)
    .order("due_at", { ascending: true })
    .limit(300);

  const dueCards = (due ?? []) as FlashcardRow[];

  // Only needed for the "all caught up" screen and its study-anyway option.
  let allCards: FlashcardRow[] = [];
  if (dueCards.length === 0) {
    const { data: all } = await supabase
      .from("flashcards")
      .select("*")
      .eq("deck_id", id)
      .eq("user_id", user.id)
      .order("due_at", { ascending: true })
      .limit(300);

    allCards = (all ?? []) as FlashcardRow[];
  }

  return (
    <StudyClient
      deck={deck as FlashcardDeckRow}
      dueCards={dueCards}
      allCards={allCards}
    />
  );
}
