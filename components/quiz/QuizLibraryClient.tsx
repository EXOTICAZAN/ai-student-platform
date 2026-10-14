"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  BarChart3,
  HelpCircle,
  ListChecks,
  Play,
  Sparkles,
  Trash2,
} from "lucide-react";
import DashboardShell from "@/components/dashboard/DashboardShell";
import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import { Badge, relativeTime } from "@/components/ui/Badge";
import GenerateQuizDialog, { type NoteOption } from "./GenerateQuizDialog";
import { deleteQuiz } from "@/app/dashboard/quiz/actions";
import { fadeUp, stagger } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { DIFFICULTY_LABELS, type QuizRow } from "@/lib/study/types";
import { DIFFICULTY_TONE, scoreTone } from "./utils";

export interface QuizSummary extends QuizRow {
  attempt_count: number;
  best_percent: number | null;
  latest_percent: number | null;
}

const TONE_TEXT = {
  emerald: "text-emerald-400",
  amber: "text-amber-400",
  rose: "text-rose-400",
} as const;

interface Props {
  quizzes: QuizSummary[];
  notes: NoteOption[];
  initialNoteId?: string | null;
}

export default function QuizLibraryClient({
  quizzes,
  notes,
  initialNoteId,
}: Props) {
  const router = useRouter();

  const [items, setItems] = useState(quizzes);
  const [generateOpen, setGenerateOpen] = useState(!!initialNoteId);
  const [pendingDelete, setPendingDelete] = useState<QuizSummary | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (initialNoteId) router.replace("/dashboard/quiz", { scroll: false });
  }, [initialNoteId, router]);

  async function onConfirmDelete() {
    if (!pendingDelete) return;

    setDeleting(true);
    try {
      const res = await deleteQuiz(pendingDelete.id);
      if (!res.ok) throw new Error(res.error ?? "Could not delete the quiz.");

      setItems((prev) => prev.filter((q) => q.id !== pendingDelete.id));
      toast.success("Quiz deleted.");
      setPendingDelete(null);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not delete the quiz.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <DashboardShell>
      <div className="mx-auto max-w-7xl space-y-6">
        <PageHeader
          icon={HelpCircle}
          title="Quiz Generator"
          subtitle="Turn any topic or note into a multiple-choice quiz with instant feedback and explanations."
          actions={
            <Button onClick={() => setGenerateOpen(true)}>
              <Sparkles className="h-4 w-4" />
              Generate quiz
            </Button>
          }
        />

        {items.length === 0 ? (
          <EmptyState
            icon={HelpCircle}
            title="No quizzes yet"
            description="Generate your first quiz from a topic or from one of your AI notes."
            action={
              <Button onClick={() => setGenerateOpen(true)}>
                <Sparkles className="h-4 w-4" />
                Generate quiz
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
            {items.map((quiz) => (
              <motion.div key={quiz.id} variants={fadeUp}>
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
                      <Badge tone={DIFFICULTY_TONE[quiz.difficulty] ?? "indigo"}>
                        {DIFFICULTY_LABELS[quiz.difficulty] ?? quiz.difficulty}
                      </Badge>
                      {quiz.subject && <Badge tone="purple">{quiz.subject}</Badge>}
                      {quiz.topic && quiz.topic !== quiz.subject && (
                        <Badge tone="sky">{quiz.topic}</Badge>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => setPendingDelete(quiz)}
                      aria-label="Delete quiz"
                      className="shrink-0 rounded-lg p-1.5 text-slate-600 transition-colors hover:bg-rose-500/10 hover:text-rose-400"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <Link href={`/dashboard/quiz/${quiz.id}`} className="flex flex-1 flex-col">
                    <h3 className="text-[15px] font-semibold leading-snug text-white transition-colors group-hover:text-indigo-300">
                      {quiz.title}
                    </h3>

                    <p className="mt-1.5 flex-1 text-[13px] text-slate-400">
                      <ListChecks className="mr-1 inline h-3.5 w-3.5 text-slate-500" />
                      {quiz.question_count} question{quiz.question_count === 1 ? "" : "s"}
                    </p>

                    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-slate-400">
                      <span className="inline-flex items-center gap-1.5">
                        <BarChart3 className="h-3.5 w-3.5 text-slate-500" />
                        Best:{" "}
                        {quiz.best_percent === null ? (
                          <span className="text-slate-500">—</span>
                        ) : (
                          <span
                            className={cn(
                              "font-semibold",
                              TONE_TEXT[scoreTone(quiz.best_percent)]
                            )}
                          >
                            {quiz.best_percent}%
                          </span>
                        )}
                      </span>
                      <span>
                        {quiz.attempt_count} attempt{quiz.attempt_count === 1 ? "" : "s"}
                      </span>
                    </div>

                    <p className="mt-3 border-t border-white/[0.06] pt-2.5 text-[11px] text-slate-500">
                      Created {relativeTime(quiz.created_at)}
                    </p>
                  </Link>

                  <div className="mt-3 flex items-center gap-2">
                    <Link
                      href={`/dashboard/quiz/${quiz.id}/take`}
                      className={cn(
                        "btn-gradient inline-flex h-8 flex-1 items-center justify-center gap-1.5",
                        "rounded-lg px-3 text-[12px] font-medium text-white shadow-lg shadow-indigo-500/20",
                        "transition-all hover:brightness-110"
                      )}
                    >
                      <Play className="h-3.5 w-3.5" />
                      {quiz.attempt_count > 0 ? "Retake" : "Start"}
                    </Link>
                    {quiz.attempt_count > 0 && (
                      <Link
                        href={`/dashboard/quiz/${quiz.id}`}
                        className={cn(
                          "inline-flex h-8 items-center justify-center rounded-lg border border-white/10",
                          "bg-white/5 px-3 text-[12px] font-medium text-slate-300",
                          "transition-all hover:border-white/20 hover:text-white"
                        )}
                      >
                        Results
                      </Link>
                    )}
                  </div>
                </article>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>

      <GenerateQuizDialog
        open={generateOpen}
        onClose={() => setGenerateOpen(false)}
        notes={notes}
        initialNoteId={initialNoteId}
      />

      <Modal
        open={!!pendingDelete}
        onClose={() => !deleting && setPendingDelete(null)}
        title="Delete this quiz?"
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
          <span className="font-medium text-white">{pendingDelete?.title}</span> will be
          permanently removed, along with its questions and every attempt you have taken.
        </p>
      </Modal>
    </DashboardShell>
  );
}
