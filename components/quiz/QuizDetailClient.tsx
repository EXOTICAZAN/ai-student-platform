"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import {
  ArrowLeft,
  Check,
  ChevronDown,
  HelpCircle,
  Play,
  RefreshCw,
  Trash2,
} from "lucide-react";
import DashboardShell from "@/components/dashboard/DashboardShell";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import { Badge, relativeTime } from "@/components/ui/Badge";
import {
  deleteAttempt,
  regenerateQuestions,
} from "@/app/dashboard/quiz/actions";
import { fadeUp, stagger } from "@/lib/motion";
import { cn } from "@/lib/utils";
import {
  DIFFICULTY_LABELS,
  type QuizAttemptRow,
  type QuizQuestionRow,
  type QuizRow,
} from "@/lib/study/types";
import { DIFFICULTY_TONE, LETTERS, percent, scoreTone } from "./utils";

interface Props {
  quiz: QuizRow;
  questions: QuizQuestionRow[];
  attempts: QuizAttemptRow[];
}

const TONE_TEXT = {
  emerald: "text-emerald-400",
  amber: "text-amber-400",
  rose: "text-rose-400",
} as const;

export default function QuizDetailClient({
  quiz,
  questions: initialQuestions,
  attempts: initialAttempts,
}: Props) {
  const router = useRouter();

  const [questions, setQuestions] = useState(initialQuestions);
  const [attempts, setAttempts] = useState(initialAttempts);
  const [regenerateOpen, setRegenerateOpen] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [showQuestions, setShowQuestions] = useState(false);
  const [pendingAttempt, setPendingAttempt] = useState<QuizAttemptRow | null>(null);
  const [deletingAttempt, setDeletingAttempt] = useState(false);

  const best = useMemo(() => {
    if (attempts.length === 0) return null;
    return Math.max(...attempts.map((a) => percent(a.score, a.total)));
  }, [attempts]);

  async function onRegenerate() {
    if (regenerating) return;

    setRegenerating(true);
    try {
      const res = await regenerateQuestions(quiz.id);
      if (!res.ok || !res.data) {
        throw new Error(res.error ?? "Could not regenerate the questions.");
      }

      setQuestions(res.data);
      setRegenerateOpen(false);
      toast.success(`Generated ${res.data.length} new questions.`);
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not regenerate the questions."
      );
    } finally {
      setRegenerating(false);
    }
  }

  async function onConfirmDeleteAttempt() {
    if (!pendingAttempt) return;

    setDeletingAttempt(true);
    try {
      const res = await deleteAttempt(pendingAttempt.id);
      if (!res.ok) throw new Error(res.error ?? "Could not delete the attempt.");

      setAttempts((prev) => prev.filter((a) => a.id !== pendingAttempt.id));
      toast.success("Attempt deleted.");
      setPendingAttempt(null);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not delete the attempt."
      );
    } finally {
      setDeletingAttempt(false);
    }
  }

  return (
    <DashboardShell>
      <div className="mx-auto max-w-5xl space-y-6">
        <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-4">
          <motion.div variants={fadeUp}>
            <Link
              href="/dashboard/quiz"
              className="inline-flex items-center gap-1.5 text-[13px] text-slate-400 transition-colors hover:text-white"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              All quizzes
            </Link>
          </motion.div>

          <motion.div
            variants={fadeUp}
            className="flex flex-wrap items-start justify-between gap-4"
          >
            <div className="min-w-0">
              <div className="mb-1.5 flex items-center gap-2">
                <HelpCircle className="h-5 w-5 shrink-0 text-indigo-400" />
                <h1 className="text-2xl font-bold text-white">{quiz.title}</h1>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <Badge tone={DIFFICULTY_TONE[quiz.difficulty] ?? "indigo"}>
                  {DIFFICULTY_LABELS[quiz.difficulty] ?? quiz.difficulty}
                </Badge>
                {quiz.subject && <Badge tone="purple">{quiz.subject}</Badge>}
                {quiz.topic && quiz.topic !== quiz.subject && (
                  <Badge tone="sky">{quiz.topic}</Badge>
                )}
                <span className="text-[11px] text-slate-500">
                  Created {relativeTime(quiz.created_at)}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button variant="secondary" onClick={() => setRegenerateOpen(true)}>
                <RefreshCw className="h-4 w-4" />
                Regenerate questions
              </Button>
              <Link
                href={`/dashboard/quiz/${quiz.id}/take`}
                className={cn(
                  "btn-gradient inline-flex h-10 items-center gap-2 rounded-xl px-4",
                  "text-sm font-medium text-white shadow-lg shadow-indigo-500/20",
                  "transition-all hover:brightness-110"
                )}
              >
                <Play className="h-4 w-4" />
                {attempts.length > 0 ? "Retake quiz" : "Start attempt"}
              </Link>
            </div>
          </motion.div>

          <motion.div variants={fadeUp} className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard label="Questions" value={String(questions.length)} />
            <StatCard
              label="Difficulty"
              value={DIFFICULTY_LABELS[quiz.difficulty] ?? quiz.difficulty}
            />
            <StatCard label="Attempts" value={String(attempts.length)} />
            <StatCard
              label="Best score"
              value={best === null ? "—" : `${best}%`}
              valueClass={best === null ? undefined : TONE_TEXT[scoreTone(best)]}
            />
          </motion.div>
        </motion.div>

        <motion.section variants={stagger} initial="hidden" animate="show" className="space-y-3">
          <motion.h2
            variants={fadeUp}
            className="text-sm font-semibold uppercase tracking-wider text-slate-400"
          >
            Attempt history
          </motion.h2>

          {attempts.length === 0 ? (
            <motion.p variants={fadeUp} className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-5 py-8 text-center text-[13px] text-slate-500">
              No attempts yet — start one and your scores will show up here.
            </motion.p>
          ) : (
            <motion.div variants={fadeUp} className="space-y-2">
              {attempts.map((attempt, i) => {
                const pct = percent(attempt.score, attempt.total);
                return (
                  <div
                    key={attempt.id}
                    className={cn(
                      "flex items-center gap-4 rounded-2xl border border-white/[0.08]",
                      "bg-white/[0.03] px-5 py-3.5 transition-colors hover:border-white/15 hover:bg-white/[0.06]"
                    )}
                  >
                    <span className="w-14 shrink-0 text-[12px] text-slate-500">
                      #{attempts.length - i}
                    </span>
                    <span className="text-sm font-medium text-white">
                      {attempt.score}/{attempt.total}
                    </span>
                    <Badge tone={scoreTone(pct)}>{pct}%</Badge>
                    <span className="ml-auto text-[12px] text-slate-500">
                      {relativeTime(attempt.completed_at)}
                    </span>
                    <button
                      type="button"
                      onClick={() => setPendingAttempt(attempt)}
                      aria-label="Delete attempt"
                      className="rounded-lg p-1.5 text-slate-600 transition-colors hover:bg-rose-500/10 hover:text-rose-400"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                );
              })}
            </motion.div>
          )}
        </motion.section>

        <motion.section variants={stagger} initial="hidden" animate="show" className="space-y-3">
          <motion.div variants={fadeUp}>
            <button
              type="button"
              onClick={() => setShowQuestions((v) => !v)}
              className={cn(
                "flex w-full items-center justify-between rounded-2xl border border-white/[0.08]",
                "bg-white/[0.03] px-5 py-4 transition-colors hover:border-white/15 hover:bg-white/[0.06]"
              )}
            >
              <span className="text-sm font-semibold uppercase tracking-wider text-slate-400">
                Question preview ({questions.length})
              </span>
              <ChevronDown
                className={cn(
                  "h-4 w-4 text-slate-500 transition-transform duration-300",
                  showQuestions && "rotate-180"
                )}
              />
            </button>
          </motion.div>

          <AnimatePresence initial={false}>
            {showQuestions && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="space-y-3">
                  {questions.map((q, qi) => (
                    <div
                      key={q.id}
                      className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5"
                    >
                      <p className="text-sm font-medium leading-relaxed text-white">
                        <span className="mr-2 text-slate-500">{qi + 1}.</span>
                        {q.question}
                      </p>
                      <div className="mt-3 grid gap-2 sm:grid-cols-2">
                        {q.options.map((option, oi) => (
                          <div
                            key={oi}
                            className={cn(
                              "flex items-start gap-2 rounded-xl border px-3 py-2 text-[13px]",
                              oi === q.correct_index
                                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                                : "border-white/[0.06] bg-white/[0.02] text-slate-400"
                            )}
                          >
                            <span className="font-semibold">{LETTERS[oi] ?? oi + 1}</span>
                            <span className="flex-1">{option}</span>
                            {oi === q.correct_index && (
                              <Check className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                            )}
                          </div>
                        ))}
                      </div>
                      {q.explanation && (
                        <p className="mt-3 text-[12px] italic leading-relaxed text-slate-500">
                          {q.explanation}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.section>
      </div>

      <Modal
        open={regenerateOpen}
        onClose={() => !regenerating && setRegenerateOpen(false)}
        title="Regenerate questions?"
        size="sm"
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => setRegenerateOpen(false)}
              disabled={regenerating}
            >
              Cancel
            </Button>
            <Button onClick={onRegenerate} loading={regenerating}>
              <RefreshCw className="h-4 w-4" />
              Regenerate
            </Button>
          </>
        }
      >
        <p className="text-[13px] leading-relaxed text-slate-400">
          The current {questions.length} question{questions.length === 1 ? "" : "s"} will
          be replaced with a fresh AI-generated set. Past attempt scores are kept, but
          they will refer to the old questions.
        </p>
      </Modal>

      <Modal
        open={!!pendingAttempt}
        onClose={() => !deletingAttempt && setPendingAttempt(null)}
        title="Delete this attempt?"
        size="sm"
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => setPendingAttempt(null)}
              disabled={deletingAttempt}
            >
              Cancel
            </Button>
            <Button variant="danger" onClick={onConfirmDeleteAttempt} loading={deletingAttempt}>
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
          </>
        }
      >
        <p className="text-[13px] leading-relaxed text-slate-400">
          Your score of{" "}
          <span className="font-medium text-white">
            {pendingAttempt?.score}/{pendingAttempt?.total}
          </span>{" "}
          from {pendingAttempt ? relativeTime(pendingAttempt.completed_at) : ""} will be
          permanently removed.
        </p>
      </Modal>
    </DashboardShell>
  );
}

function StatCard({
  label,
  value,
  valueClass,
}: {
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4">
      <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
        {label}
      </p>
      <p className={cn("mt-1 text-xl font-bold text-white", valueClass)}>{value}</p>
    </div>
  );
}
