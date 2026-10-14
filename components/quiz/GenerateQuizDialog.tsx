"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Sparkles, NotebookPen } from "lucide-react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import { Field, Input, Select } from "@/components/ui/Field";
import { cn } from "@/lib/utils";
import {
  DIFFICULTY_LABELS,
  type QuizDifficulty,
  type QuizRow,
} from "@/lib/study/types";

export interface NoteOption {
  id: string;
  title: string;
  subject: string | null;
}

interface Props {
  open: boolean;
  onClose: () => void;
  notes: NoteOption[];
  initialNoteId?: string | null;
}

const DIFFICULTIES: QuizDifficulty[] = ["easy", "medium", "hard", "mixed"];

export default function GenerateQuizDialog({
  open,
  onClose,
  notes,
  initialNoteId,
}: Props) {
  const router = useRouter();

  const [topic, setTopic] = useState("");
  const [subject, setSubject] = useState("");
  const [noteId, setNoteId] = useState(initialNoteId ?? "");
  const [count, setCount] = useState(8);
  const [difficulty, setDifficulty] = useState<QuizDifficulty>("mixed");
  const [busy, setBusy] = useState(false);

  function reset() {
    setTopic("");
    setSubject("");
    setNoteId("");
    setCount(8);
    setDifficulty("mixed");
  }

  function close() {
    if (busy) return;
    reset();
    onClose();
  }

  async function onGenerate() {
    if (busy) return;

    if (!noteId && !topic.trim()) {
      toast.error("Enter a topic or choose one of your notes.");
      return;
    }

    setBusy(true);

    try {
      const res = await fetch("/api/quiz/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: topic.trim() || undefined,
          subject: subject.trim() || undefined,
          noteId: noteId || undefined,
          count,
          difficulty,
        }),
      });

      const body = await res.json();

      if (!res.ok || !body?.data) {
        throw new Error(body?.error?.message ?? "Generation failed.");
      }

      const quiz = body.data as QuizRow;

      toast.success("Quiz created.");
      reset();
      onClose();
      router.push(`/dashboard/quiz/${quiz.id}`);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Generation failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={close}
      title="Generate a quiz with AI"
      description="Multiple-choice questions from a topic or from one of your notes, with explanations."
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={close} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={onGenerate} loading={busy}>
            <Sparkles className="h-4 w-4" />
            {busy ? "Generating…" : "Generate quiz"}
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Topic"
            hint={noteId ? "Optional — the note provides the material." : undefined}
          >
            <Input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Photosynthesis light reactions"
              disabled={busy}
              maxLength={400}
            />
          </Field>
          <Field label="Subject (optional)">
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Biology"
              disabled={busy}
            />
          </Field>
        </div>

        {notes.length > 0 && (
          <Field
            label="From one of my notes (optional)"
            hint={
              noteId
                ? "Questions will be derived strictly from the note's content."
                : undefined
            }
          >
            <Select
              value={noteId}
              onChange={(e) => setNoteId(e.target.value)}
              disabled={busy}
            >
              <option value="">Just the topic</option>
              {notes.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.title}
                  {n.subject ? ` — ${n.subject}` : ""}
                </option>
              ))}
            </Select>
          </Field>
        )}

        {noteId && notes.length === 0 && (
          <div className="flex items-start gap-3 rounded-xl border border-amber-500/25 bg-amber-500/8 p-4">
            <NotebookPen className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
            <p className="text-[13px] text-slate-300">
              The linked note is no longer available. Pick a topic instead.
            </p>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Questions" hint={`${count} multiple-choice questions`}>
            <input
              type="range"
              min={3}
              max={25}
              step={1}
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
              disabled={busy}
              className="mt-2 w-full accent-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </Field>

          <Field label="Difficulty">
            <div className="flex flex-wrap gap-1.5 pt-1">
              {DIFFICULTIES.map((d) => (
                <button
                  key={d}
                  type="button"
                  disabled={busy}
                  onClick={() => setDifficulty(d)}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-[12px] font-medium transition-all",
                    difficulty === d
                      ? "border-indigo-500/50 bg-indigo-500/15 text-indigo-200"
                      : "border-white/10 bg-white/[0.03] text-slate-400 hover:border-white/20 hover:text-white",
                    busy && "cursor-not-allowed opacity-60"
                  )}
                >
                  {DIFFICULTY_LABELS[d]}
                </button>
              ))}
            </div>
          </Field>
        </div>
      </div>
    </Modal>
  );
}
