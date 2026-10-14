"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  ArrowRight,
  Clock3,
  Layers,
  Play,
  Plus,
  Sparkles,
  Trash2,
} from "lucide-react";
import DashboardShell from "@/components/dashboard/DashboardShell";
import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import { Field, Input, Textarea } from "@/components/ui/Field";
import { Badge, relativeTime } from "@/components/ui/Badge";
import GenerateDeckDialog from "./GenerateDeckDialog";
import {
  createDeck,
  deleteDeck,
} from "@/app/dashboard/flashcards/actions";
import { fadeUp, stagger } from "@/lib/motion";
import { cn } from "@/lib/utils";
import type { DeckWithStats, NoteOption } from "./types";

interface Props {
  decks: DeckWithStats[];
  notes: NoteOption[];
  initialNoteId?: string;
}

export default function DecksClient({ decks, notes, initialNoteId }: Props) {
  const router = useRouter();

  const [items, setItems] = useState(decks);
  const [generateOpen, setGenerateOpen] = useState(!!initialNoteId);
  const [newOpen, setNewOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newSubject, setNewSubject] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [creating, setCreating] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<DeckWithStats | null>(null);
  const [deleting, setDeleting] = useState(false);

  function resetNew() {
    setNewTitle("");
    setNewSubject("");
    setNewDescription("");
  }

  async function onCreateDeck() {
    const title = newTitle.trim();
    if (!title) {
      toast.error("Give the deck a title.");
      return;
    }

    setCreating(true);
    try {
      const res = await createDeck({
        title,
        subject: newSubject.trim() || null,
        description: newDescription.trim() || null,
      });
      const deck = res.data;
      if (!res.ok || !deck)
        throw new Error(res.error ?? "Could not create the deck.");

      setItems((prev) => [{ ...deck, card_count: 0, due_count: 0 }, ...prev]);
      toast.success("Deck created.");
      setNewOpen(false);
      resetNew();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not create the deck."
      );
    } finally {
      setCreating(false);
    }
  }

  async function onConfirmDelete() {
    if (!pendingDelete) return;

    setDeleting(true);
    try {
      const res = await deleteDeck(pendingDelete.id);
      if (!res.ok) throw new Error(res.error ?? "Could not delete the deck.");

      setItems((prev) => prev.filter((d) => d.id !== pendingDelete.id));
      toast.success("Deck deleted.");
      setPendingDelete(null);
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not delete the deck."
      );
    } finally {
      setDeleting(false);
    }
  }

  return (
    <DashboardShell>
      <div className="mx-auto max-w-7xl space-y-6">
        <PageHeader
          icon={Layers}
          title="Flashcards"
          subtitle="Spaced-repetition decks that turn your notes into long-term memory."
          actions={
            <>
              <Button variant="secondary" onClick={() => setNewOpen(true)}>
                <Plus className="h-4 w-4" />
                New deck
              </Button>
              <Button onClick={() => setGenerateOpen(true)}>
                <Sparkles className="h-4 w-4" />
                Generate with AI
              </Button>
            </>
          }
        />

        {items.length === 0 ? (
          <EmptyState
            icon={Layers}
            title="No decks yet"
            description="Generate your first flashcard deck with AI — from a topic or straight from one of your notes."
            action={
              <Button onClick={() => setGenerateOpen(true)}>
                <Sparkles className="h-4 w-4" />
                Generate with AI
              </Button>
            }
          />
        ) : (
          <motion.div
            variants={stagger}
            initial="hidden"
            animate="show"
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          >
            {items.map((deck) => (
              <motion.div key={deck.id} variants={fadeUp}>
                <article
                  className={cn(
                    "group relative flex h-full flex-col rounded-2xl border border-white/[0.08]",
                    "bg-white/[0.03] p-5 transition-all duration-300",
                    "hover:-translate-y-1 hover:border-white/15 hover:bg-white/[0.06]",
                    "hover:shadow-[0_8px_30px_rgba(0,0,0,0.25)]"
                  )}
                >
                  <div className="mb-2.5 flex items-start justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {deck.subject && <Badge tone="purple">{deck.subject}</Badge>}
                      {deck.due_count > 0 ? (
                        <Badge tone="amber">
                          <Clock3 className="h-3 w-3" />
                          {deck.due_count} due
                        </Badge>
                      ) : deck.card_count > 0 ? (
                        <Badge tone="emerald">All caught up</Badge>
                      ) : (
                        <Badge tone="neutral">Empty</Badge>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => setPendingDelete(deck)}
                      aria-label="Delete deck"
                      className="rounded-lg p-1.5 text-slate-600 transition-colors hover:bg-rose-500/10 hover:text-rose-400"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <Link
                    href={`/dashboard/flashcards/${deck.id}`}
                    className="flex flex-1 flex-col"
                  >
                    <h3 className="text-[15px] font-semibold leading-snug text-white transition-colors group-hover:text-indigo-300">
                      {deck.title}
                    </h3>

                    <p className="mt-1.5 line-clamp-2 flex-1 text-[13px] leading-relaxed text-slate-400">
                      {deck.description ||
                        (deck.card_count > 0
                          ? `${deck.card_count} cards ready to review.`
                          : "Empty deck — open it to add or generate cards.")}
                    </p>

                    <p className="mt-3 text-[12px] text-slate-500">
                      {deck.card_count} {deck.card_count === 1 ? "card" : "cards"}
                    </p>
                  </Link>

                  <div className="mt-3 flex items-center justify-between gap-2 border-t border-white/[0.06] pt-3">
                    <span className="text-[11px] text-slate-500">
                      Created {relativeTime(deck.created_at)}
                    </span>

                    <div className="flex items-center gap-1.5">
                      <Link
                        href={`/dashboard/flashcards/${deck.id}`}
                        className="inline-flex h-8 items-center gap-1 rounded-lg border border-white/10 bg-white/[0.03] px-2.5 text-[12px] font-medium text-slate-300 transition-all hover:border-white/20 hover:text-white"
                      >
                        Open
                        <ArrowRight className="h-3 w-3" />
                      </Link>
                      <Link
                        href={`/dashboard/flashcards/${deck.id}/study`}
                        className={cn(
                          "inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-[12px] font-medium transition-all",
                          deck.due_count > 0
                            ? "btn-gradient text-white shadow-lg shadow-indigo-500/20 hover:brightness-110"
                            : "border border-white/10 bg-white/[0.03] text-slate-300 hover:border-white/20 hover:text-white"
                        )}
                      >
                        <Play className="h-3 w-3" />
                        Study
                      </Link>
                    </div>
                  </div>
                </article>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>

      <GenerateDeckDialog
        open={generateOpen}
        onClose={() => setGenerateOpen(false)}
        notes={notes}
        initialNoteId={initialNoteId}
      />

      <Modal
        open={newOpen}
        onClose={() => !creating && setNewOpen(false)}
        title="New deck"
        size="sm"
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => setNewOpen(false)}
              disabled={creating}
            >
              Cancel
            </Button>
            <Button onClick={onCreateDeck} loading={creating}>
              Create deck
            </Button>
          </>
        }
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void onCreateDeck();
          }}
          className="space-y-4"
        >
          <Field label="Title">
            <Input
              autoFocus
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="e.g. Organic chemistry — reactions"
              maxLength={200}
              disabled={creating}
            />
          </Field>
          <Field label="Subject (optional)">
            <Input
              value={newSubject}
              onChange={(e) => setNewSubject(e.target.value)}
              placeholder="Chemistry"
              disabled={creating}
            />
          </Field>
          <Field label="Description (optional)">
            <Textarea
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              placeholder="What this deck covers…"
              className="min-h-[80px]"
              disabled={creating}
            />
          </Field>
          <button type="submit" className="hidden" />
        </form>
      </Modal>

      <Modal
        open={!!pendingDelete}
        onClose={() => !deleting && setPendingDelete(null)}
        title="Delete this deck?"
        size="sm"
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => setPendingDelete(null)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button variant="danger" onClick={onConfirmDelete} loading={deleting}>
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
          </>
        }
      >
        <p className="text-[13px] leading-relaxed text-slate-400">
          <span className="font-medium text-white">{pendingDelete?.title}</span>{" "}
          and its{" "}
          <span className="font-medium text-white">
            {pendingDelete?.card_count ?? 0} cards
          </span>{" "}
          will be permanently removed, including all review history.
        </p>
      </Modal>
    </DashboardShell>
  );
}
