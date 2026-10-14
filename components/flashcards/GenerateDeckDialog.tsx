"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { NotebookPen, Sparkles } from "lucide-react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import { Field, Input, Select } from "@/components/ui/Field";
import { generateDeckFromAI } from "@/app/dashboard/flashcards/actions";
import { cn } from "@/lib/utils";
import type { NoteOption } from "./types";

type Mode = "topic" | "note";

const MODES: { id: Mode; label: string; desc: string; icon: typeof Sparkles }[] = [
  { id: "topic", label: "From a topic", desc: "AI writes the cards", icon: Sparkles },
  { id: "note", label: "From a note", desc: "Use an existing note", icon: NotebookPen },
];

const COUNTS = [8, 12, 16, 20, 25];

interface Props {
  open: boolean;
  onClose: () => void;
  notes: NoteOption[];
  initialNoteId?: string;
}

export default function GenerateDeckDialog({
  open,
  onClose,
  notes,
  initialNoteId,
}: Props) {
  const router = useRouter();

  const preselected =
    initialNoteId && notes.some((n) => n.id === initialNoteId)
      ? initialNoteId
      : "";

  const [mode, setMode] = useState<Mode>(preselected ? "note" : "topic");
  const [topic, setTopic] = useState("");
  const [subject, setSubject] = useState("");
  const [noteId, setNoteId] = useState(preselected);
  const [count, setCount] = useState(12);
  const [busy, setBusy] = useState(false);

  function reset() {
    setMode(preselected ? "note" : "topic");
    setTopic("");
    setSubject("");
    setNoteId(preselected);
    setCount(12);
  }

  function close() {
    if (busy) return;
    reset();
    onClose();
  }

  async function onGenerate() {
    if (busy) return;

    if (mode === "topic" && !topic.trim()) {
      toast.error("Enter a topic first.");
      return;
    }
    if (mode === "note" && !noteId) {
      toast.error("Choose a note.");
      return;
    }

    setBusy(true);

    try {
      const res = await generateDeckFromAI({
        topic: mode === "topic" ? topic.trim() : undefined,
        subject: subject.trim() || undefined,
        noteId: mode === "note" ? noteId : undefined,
        count,
      });

      if (!res.ok || !res.data)
        throw new Error(res.error ?? "Generation failed.");

      toast.success("Deck generated.");
      reset();
      onClose();
      router.push(`/dashboard/flashcards/${res.data.id}`);
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Generation failed."
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={close}
      title="Generate a deck with AI"
      description="Pick a source. EduForge creates a new deck filled with spaced-repetition cards."
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={close} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={onGenerate} loading={busy}>
            <Sparkles className="h-4 w-4" />
            {busy ? "Generating…" : "Generate deck"}
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <div className="grid gap-2 sm:grid-cols-2">
          {MODES.map(({ id, label, desc, icon: Icon }) => (
            <button
              key={id}
              type="button"
              disabled={busy}
              onClick={() => setMode(id)}
              className={cn(
                "flex flex-col gap-1 rounded-xl border p-3 text-left transition-all",
                mode === id
                  ? "border-indigo-500/50 bg-indigo-500/10"
                  : "border-white/10 bg-white/[0.03] hover:border-white/20",
                busy && "cursor-not-allowed opacity-60"
              )}
            >
              <span className="flex items-center gap-1.5 text-[13px] font-medium text-white">
                <Icon className="h-3.5 w-3.5 text-indigo-400" />
                {label}
              </span>
              <span className="text-[11px] text-slate-500">{desc}</span>
            </button>
          ))}
        </div>

        {mode === "topic" && (
          <Field
            label="Topic"
            hint="Be specific — “The Krebs cycle” beats “Biology”."
          >
            <Input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Photosynthesis light reactions"
              disabled={busy}
              maxLength={400}
            />
          </Field>
        )}

        {mode === "note" &&
          (notes.length === 0 ? (
            <div className="flex items-start gap-3 rounded-xl border border-amber-500/25 bg-amber-500/8 p-4">
              <NotebookPen className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
              <div className="text-[13px] text-slate-300">
                <p className="font-medium text-white">No notes yet</p>
                <p className="mt-1 text-slate-400">
                  Create a note in AI Notes first — its content becomes the
                  source material for your cards.
                </p>
              </div>
            </div>
          ) : (
            <Field label="Note">
              <Select
                value={noteId}
                onChange={(e) => setNoteId(e.target.value)}
                disabled={busy}
              >
                <option value="">Select one of your notes…</option>
                {notes.map((note) => (
                  <option key={note.id} value={note.id}>
                    {note.title}
                    {note.subject ? ` — ${note.subject}` : ""}
                  </option>
                ))}
              </Select>
            </Field>
          ))}

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Subject (optional)">
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Biology"
              disabled={busy}
            />
          </Field>
          <Field label="Number of cards">
            <Select
              value={String(count)}
              onChange={(e) => setCount(Number(e.target.value))}
              disabled={busy}
            >
              {COUNTS.map((n) => (
                <option key={n} value={n}>
                  {n} cards
                </option>
              ))}
            </Select>
          </Field>
        </div>
      </div>
    </Modal>
  );
}
