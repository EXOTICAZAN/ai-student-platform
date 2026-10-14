"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  ArrowLeft,
  Clock3,
  Layers,
  Lightbulb,
  Pencil,
  Play,
  Plus,
  RefreshCw,
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
import GenerateCardsDialog from "./GenerateCardsDialog";
import {
  addCard,
  deleteCard,
  updateCard,
  updateDeck,
} from "@/app/dashboard/flashcards/actions";
import { dueLabel } from "./sm2";
import { fadeUp, stagger } from "@/lib/motion";
import { cn } from "@/lib/utils";
import type { FlashcardDeckRow, FlashcardRow } from "@/lib/study/types";

interface Props {
  deck: FlashcardDeckRow;
  cards: FlashcardRow[];
}

export default function DeckDetailClient({ deck, cards }: Props) {
  const router = useRouter();

  const [now] = useState(() => Date.now());
  const [items, setItems] = useState(cards);

  const [addOpen, setAddOpen] = useState(false);
  const [newFront, setNewFront] = useState("");
  const [newBack, setNewBack] = useState("");
  const [newHint, setNewHint] = useState("");
  const [adding, setAdding] = useState(false);

  const [editing, setEditing] = useState<FlashcardRow | null>(null);
  const [editFront, setEditFront] = useState("");
  const [editBack, setEditBack] = useState("");
  const [editHint, setEditHint] = useState("");
  const [saving, setSaving] = useState(false);

  const [pendingDelete, setPendingDelete] = useState<FlashcardRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [deckEditOpen, setDeckEditOpen] = useState(false);
  const [deckTitle, setDeckTitle] = useState(deck.title);
  const [deckSubject, setDeckSubject] = useState(deck.subject ?? "");
  const [deckDescription, setDeckDescription] = useState(deck.description ?? "");
  const [savingDeck, setSavingDeck] = useState(false);

  const [generateOpen, setGenerateOpen] = useState(false);

  const dueCount = useMemo(
    () => items.filter((c) => new Date(c.due_at).getTime() <= now).length,
    [items, now]
  );

  const totalReviews = useMemo(
    () => items.reduce((sum, c) => sum + c.reviews, 0),
    [items]
  );

  function openEdit(card: FlashcardRow) {
    setEditing(card);
    setEditFront(card.front);
    setEditBack(card.back);
    setEditHint(card.hint ?? "");
  }

  async function onAddCard() {
    const front = newFront.trim();
    const back = newBack.trim();
    if (!front || !back) {
      toast.error("Both sides of the card are required.");
      return;
    }

    setAdding(true);
    try {
      const res = await addCard(deck.id, {
        front,
        back,
        hint: newHint.trim() || null,
      });
      if (!res.ok || !res.data)
        throw new Error(res.error ?? "Could not add the card.");

      setItems((prev) => [...prev, res.data as FlashcardRow]);
      setNewFront("");
      setNewBack("");
      setNewHint("");
      setAddOpen(false);
      toast.success("Card added.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not add the card."
      );
    } finally {
      setAdding(false);
    }
  }

  async function onSaveCard() {
    if (!editing) return;

    const front = editFront.trim();
    const back = editBack.trim();
    if (!front || !back) {
      toast.error("Both sides of the card are required.");
      return;
    }

    setSaving(true);
    try {
      const res = await updateCard(editing.id, {
        front,
        back,
        hint: editHint.trim() || null,
      });
      if (!res.ok || !res.data)
        throw new Error(res.error ?? "Could not save the card.");

      const updated = res.data;
      setItems((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      toast.success("Card saved.");
      setEditing(null);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not save the card."
      );
    } finally {
      setSaving(false);
    }
  }

  async function onConfirmDeleteCard() {
    if (!pendingDelete) return;

    setDeleting(true);
    try {
      const res = await deleteCard(pendingDelete.id);
      if (!res.ok) throw new Error(res.error ?? "Could not delete the card.");

      setItems((prev) => prev.filter((c) => c.id !== pendingDelete.id));
      toast.success("Card deleted.");
      setPendingDelete(null);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not delete the card."
      );
    } finally {
      setDeleting(false);
    }
  }

  async function onSaveDeck() {
    const title = deckTitle.trim();
    if (!title) {
      toast.error("A title is required.");
      return;
    }

    setSavingDeck(true);
    try {
      const res = await updateDeck(deck.id, {
        title,
        subject: deckSubject,
        description: deckDescription,
      });
      if (!res.ok) throw new Error(res.error ?? "Could not save the deck.");

      toast.success("Deck saved.");
      setDeckEditOpen(false);
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not save the deck."
      );
    } finally {
      setSavingDeck(false);
    }
  }

  return (
    <DashboardShell>
      <div className="mx-auto max-w-5xl space-y-6">
        <Link
          href="/dashboard/flashcards"
          className="inline-flex items-center gap-1.5 text-[13px] text-slate-500 transition-colors hover:text-white"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          All decks
        </Link>

        <PageHeader
          icon={Layers}
          title={deck.title}
          subtitle={
            deck.description ||
            (deck.subject
              ? `${deck.subject} · created ${relativeTime(deck.created_at)}`
              : `Created ${relativeTime(deck.created_at)}`)
          }
          actions={
            <>
              <Button variant="ghost" size="icon" onClick={() => setDeckEditOpen(true)} aria-label="Edit deck">
                <Pencil className="h-4 w-4" />
              </Button>
              <Button variant="secondary" onClick={() => setGenerateOpen(true)}>
                <Sparkles className="h-4 w-4" />
                Generate more
              </Button>
              <Button
                onClick={() => router.push(`/dashboard/flashcards/${deck.id}/study`)}
                disabled={items.length === 0}
              >
                <Play className="h-4 w-4" />
                {dueCount > 0 ? `Study ${dueCount} due cards` : "Study"}
              </Button>
            </>
          }
        />

        <motion.div
          variants={stagger}
          initial="hidden"
          animate="show"
          className="grid gap-3 sm:grid-cols-3"
        >
          <StatCard variants={fadeUp} label="Cards" value={items.length} icon={Layers} />
          <StatCard variants={fadeUp} label="Due now" value={dueCount} icon={Clock3} highlight={dueCount > 0} />
          <StatCard variants={fadeUp} label="Total reviews" value={totalReviews} icon={RefreshCw} />
        </motion.div>

        <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-4">
          <motion.div variants={fadeUp} className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
              Cards
            </h2>
            <Button variant="secondary" size="sm" onClick={() => setAddOpen((v) => !v)}>
              <Plus className="h-4 w-4" />
              Add card
            </Button>
          </motion.div>

          {addOpen && (
            <motion.div
              variants={fadeUp}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4 rounded-2xl border border-indigo-500/25 bg-indigo-500/[0.06] p-5"
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Front (question)">
                  <Textarea
                    autoFocus
                    value={newFront}
                    onChange={(e) => setNewFront(e.target.value)}
                    placeholder="What does ATP stand for?"
                    className="min-h-[90px]"
                    disabled={adding}
                  />
                </Field>
                <Field label="Back (answer)">
                  <Textarea
                    value={newBack}
                    onChange={(e) => setNewBack(e.target.value)}
                    placeholder="Adenosine triphosphate"
                    className="min-h-[90px]"
                    disabled={adding}
                  />
                </Field>
              </div>
              <Field label="Hint (optional)">
                <Input
                  value={newHint}
                  onChange={(e) => setNewHint(e.target.value)}
                  placeholder="A one-line nudge, not the answer"
                  disabled={adding}
                />
              </Field>
              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setAddOpen(false)} disabled={adding}>
                  Cancel
                </Button>
                <Button onClick={onAddCard} loading={adding}>
                  <Plus className="h-4 w-4" />
                  Add card
                </Button>
              </div>
            </motion.div>
          )}

          {items.length === 0 ? (
            <EmptyState
              icon={Layers}
              title="No cards in this deck yet"
              description="Add cards by hand, or let AI generate a batch from the deck topic."
              action={
                <div className="flex gap-2">
                  <Button variant="secondary" onClick={() => setAddOpen(true)}>
                    <Plus className="h-4 w-4" />
                    Add card
                  </Button>
                  <Button onClick={() => setGenerateOpen(true)}>
                    <Sparkles className="h-4 w-4" />
                    Generate with AI
                  </Button>
                </div>
              }
            />
          ) : (
            <motion.ul variants={stagger} className="space-y-2.5">
              {items.map((card) => {
                const isDue = new Date(card.due_at).getTime() <= now;

                return (
                  <motion.li
                    key={card.id}
                    variants={fadeUp}
                    className={cn(
                      "group rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4",
                      "transition-all duration-300 hover:border-white/15 hover:bg-white/[0.06]"
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-[14px] font-medium leading-snug text-white">
                          {card.front}
                        </p>
                        <p className="mt-1 line-clamp-2 text-[13px] leading-relaxed text-slate-400">
                          {card.back}
                        </p>
                        {card.hint && (
                          <p className="mt-1.5 flex items-center gap-1.5 text-[12px] text-slate-500">
                            <Lightbulb className="h-3 w-3 shrink-0 text-amber-400/70" />
                            {card.hint}
                          </p>
                        )}
                        <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                          <Badge tone={isDue ? "amber" : "emerald"}>
                            {isDue ? "Due now" : dueLabel(card.due_at, now)}
                          </Badge>
                          <Badge tone="neutral">
                            {card.reviews} {card.reviews === 1 ? "review" : "reviews"}
                          </Badge>
                          {card.lapses > 0 && <Badge tone="rose">{card.lapses} lapses</Badge>}
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center gap-0.5">
                        <button
                          type="button"
                          onClick={() => openEdit(card)}
                          aria-label="Edit card"
                          className="rounded-lg p-1.5 text-slate-600 transition-colors hover:bg-white/[0.06] hover:text-indigo-300"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setPendingDelete(card)}
                          aria-label="Delete card"
                          className="rounded-lg p-1.5 text-slate-600 transition-colors hover:bg-rose-500/10 hover:text-rose-400"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </motion.li>
                );
              })}
            </motion.ul>
          )}
        </motion.div>
      </div>

      <GenerateCardsDialog
        open={generateOpen}
        onClose={() => setGenerateOpen(false)}
        deckId={deck.id}
        deckTitle={deck.title}
        onGenerated={(generated) => setItems((prev) => [...prev, ...generated])}
      />

      <Modal
        open={!!editing}
        onClose={() => !saving && setEditing(null)}
        title="Edit card"
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={() => setEditing(null)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={onSaveCard} loading={saving}>
              Save card
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Front (question)">
            <Textarea
              value={editFront}
              onChange={(e) => setEditFront(e.target.value)}
              className="min-h-[90px]"
              disabled={saving}
            />
          </Field>
          <Field label="Back (answer)">
            <Textarea
              value={editBack}
              onChange={(e) => setEditBack(e.target.value)}
              className="min-h-[90px]"
              disabled={saving}
            />
          </Field>
          <Field label="Hint (optional)">
            <Input
              value={editHint}
              onChange={(e) => setEditHint(e.target.value)}
              disabled={saving}
            />
          </Field>
        </div>
      </Modal>

      <Modal
        open={deckEditOpen}
        onClose={() => !savingDeck && setDeckEditOpen(false)}
        title="Edit deck"
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeckEditOpen(false)} disabled={savingDeck}>
              Cancel
            </Button>
            <Button onClick={onSaveDeck} loading={savingDeck}>
              Save deck
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Title">
            <Input
              value={deckTitle}
              onChange={(e) => setDeckTitle(e.target.value)}
              maxLength={200}
              disabled={savingDeck}
            />
          </Field>
          <Field label="Subject (optional)">
            <Input
              value={deckSubject}
              onChange={(e) => setDeckSubject(e.target.value)}
              placeholder="Chemistry"
              disabled={savingDeck}
            />
          </Field>
          <Field label="Description (optional)">
            <Textarea
              value={deckDescription}
              onChange={(e) => setDeckDescription(e.target.value)}
              className="min-h-[80px]"
              disabled={savingDeck}
            />
          </Field>
        </div>
      </Modal>

      <Modal
        open={!!pendingDelete}
        onClose={() => !deleting && setPendingDelete(null)}
        title="Delete this card?"
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setPendingDelete(null)} disabled={deleting}>
              Cancel
            </Button>
            <Button variant="danger" onClick={onConfirmDeleteCard} loading={deleting}>
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
          </>
        }
      >
        <p className="text-[13px] leading-relaxed text-slate-400">
          <span className="font-medium text-white">
            {pendingDelete?.front.slice(0, 120)}
          </span>{" "}
          will be permanently removed from this deck, including its review
          history.
        </p>
      </Modal>
    </DashboardShell>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  highlight,
  variants,
}: {
  label: string;
  value: number;
  icon: typeof Layers;
  highlight?: boolean;
  variants: typeof fadeUp;
}) {
  return (
    <motion.div
      variants={variants}
      className="flex items-center gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4"
    >
      <div
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
          highlight ? "bg-amber-500/15 text-amber-300" : "bg-indigo-500/15 text-indigo-300"
        )}
      >
        <Icon className="h-4.5 w-4.5" />
      </div>
      <div>
        <p className="text-xl font-bold text-white">{value}</p>
        <p className="text-[12px] text-slate-500">{label}</p>
      </div>
    </motion.div>
  );
}
