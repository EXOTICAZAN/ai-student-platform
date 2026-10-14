"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import {
  ArrowLeft,
  CheckCircle2,
  Layers,
  Lightbulb,
  MousePointerClick,
  PartyPopper,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import DashboardShell from "@/components/dashboard/DashboardShell";
import EmptyState from "@/components/ui/EmptyState";
import Button from "@/components/ui/Button";
import { gradeCard } from "@/app/dashboard/flashcards/actions";
import { applyGrade, dueLabel, intervalLabel, type Grade } from "./sm2";
import { ease as motionEase } from "@/lib/motion";
import { cn } from "@/lib/utils";
import type { FlashcardDeckRow, FlashcardRow } from "@/lib/study/types";

interface Props {
  deck: FlashcardDeckRow;
  dueCards: FlashcardRow[];
  allCards: FlashcardRow[];
}

const GRADES: {
  id: Grade;
  label: string;
  key: string;
  className: string;
}[] = [
  {
    id: "again",
    label: "Again",
    key: "1",
    className:
      "border-rose-500/30 bg-rose-500/10 text-rose-300 hover:border-rose-500/50 hover:bg-rose-500/20",
  },
  {
    id: "hard",
    label: "Hard",
    key: "2",
    className:
      "border-amber-500/30 bg-amber-500/10 text-amber-300 hover:border-amber-500/50 hover:bg-amber-500/20",
  },
  {
    id: "good",
    label: "Good",
    key: "3",
    className:
      "border-sky-500/30 bg-sky-500/10 text-sky-300 hover:border-sky-500/50 hover:bg-sky-500/20",
  },
  {
    id: "easy",
    label: "Easy",
    key: "4",
    className:
      "border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:border-emerald-500/50 hover:bg-emerald-500/20",
  },
];

const KEY_TO_GRADE: Record<string, Grade> = {
  "1": "again",
  "2": "hard",
  "3": "good",
  "4": "easy",
};

export default function StudyClient({ deck, dueCards, allCards }: Props) {
  const router = useRouter();

  const [queue, setQueue] = useState<FlashcardRow[]>(dueCards);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [grading, setGrading] = useState(false);
  const [reviewed, setReviewed] = useState(0);
  const [remembered, setRemembered] = useState(0);
  const [xpEarned, setXpEarned] = useState(0);

  const card = queue[index];
  const finished = queue.length > 0 && index >= queue.length;

  const nextDueAt = useMemo(() => {
    if (allCards.length === 0) return null;
    return allCards.reduce(
      (min, c) => (c.due_at < min ? c.due_at : min),
      allCards[0].due_at
    );
  }, [allCards]);

  const previews = useMemo(() => {
    if (!card) return [];
    return GRADES.map((g) => ({
      ...g,
      next: intervalLabel(applyGrade(card, g.id).interval_days),
    }));
  }, [card]);

  const onGrade = useCallback(
    async (grade: Grade) => {
      if (!card || grading) return;

      setGrading(true);
      try {
        const res = await gradeCard(card.id, grade);
        const payload = res.data;
        if (!res.ok || !payload)
          throw new Error(res.error ?? "Could not save the review.");

        setReviewed((n) => n + 1);
        if (grade !== "again") setRemembered((n) => n + 1);
        setXpEarned((n) => n + payload.xp);
        setFlipped(false);
        setIndex((i) => i + 1);
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Could not save the review."
        );
      } finally {
        setGrading(false);
      }
    },
    [card, grading]
  );

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)
        return;

      if (e.code === "Space") {
        if (card && !finished && !grading) {
          e.preventDefault();
          setFlipped((v) => !v);
        }
        return;
      }

      const grade = KEY_TO_GRADE[e.key];
      if (grade && card && flipped && !grading) {
        e.preventDefault();
        void onGrade(grade);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [card, flipped, grading, finished, onGrade]);

  function studyAll() {
    setQueue(allCards);
    setIndex(0);
    setFlipped(false);
  }

  const accuracy = reviewed > 0 ? Math.round((remembered / reviewed) * 100) : 0;

  return (
    <DashboardShell>
      <div className="mx-auto max-w-3xl space-y-6">
        <Link
          href={`/dashboard/flashcards/${deck.id}`}
          className="inline-flex items-center gap-1.5 text-[13px] text-slate-500 transition-colors hover:text-white"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to {deck.title}
        </Link>

        {queue.length === 0 ? (
          <EmptyState
            icon={CheckCircle2}
            title="All caught up!"
            description={
              allCards.length === 0
                ? "This deck has no cards yet. Add some or generate them with AI."
                : `Nothing is due right now. Your next card is ${
                    nextDueAt ? dueLabel(nextDueAt).toLowerCase() : "coming up"
                  }.`
            }
            action={
              <div className="flex flex-wrap justify-center gap-2">
                {allCards.length > 0 && (
                  <Button onClick={studyAll}>
                    <RotateCcw className="h-4 w-4" />
                    Study all {allCards.length} cards anyway
                  </Button>
                )}
                <Button
                  variant="secondary"
                  onClick={() => router.push(`/dashboard/flashcards/${deck.id}`)}
                >
                  {allCards.length === 0 ? "Go to deck" : "Back to deck"}
                </Button>
              </div>
            }
          />
        ) : finished ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, ease: motionEase }}
            className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-8 text-center"
          >
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 ring-1 ring-white/10">
              <PartyPopper className="h-6 w-6 text-indigo-300" />
            </div>
            <h2 className="mt-4 text-xl font-bold text-white">Session complete</h2>
            <p className="mt-1.5 text-[13px] text-slate-400">
              Nice work on {deck.title}.
            </p>

            <div className="mx-auto mt-6 grid max-w-md gap-3 sm:grid-cols-3">
              <ResultStat label="Reviewed" value={String(reviewed)} />
              <ResultStat label="Accuracy" value={`${accuracy}%`} />
              <ResultStat label="XP earned" value={`+${xpEarned}`} />
            </div>

            <div className="mt-7 flex flex-wrap justify-center gap-2">
              <Button
                variant="secondary"
                onClick={() => router.push(`/dashboard/flashcards/${deck.id}`)}
              >
                Back to deck
              </Button>
              <Button onClick={() => router.push("/dashboard/flashcards")}>
                <Layers className="h-4 w-4" />
                All decks
              </Button>
            </div>
          </motion.div>
        ) : (
          <>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[12px] text-slate-500">
                <span className="font-medium text-slate-400">
                  Card {index + 1} of {queue.length}
                </span>
                {deck.subject && <span>{deck.subject}</span>}
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
                <motion.div
                  className="btn-gradient h-full rounded-full"
                  initial={false}
                  animate={{ width: `${(index / queue.length) * 100}%` }}
                  transition={{ duration: 0.35, ease: motionEase }}
                />
              </div>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={card.id}
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -24 }}
                transition={{ duration: 0.25, ease: motionEase }}
              >
                <div
                  className="perspective-1200 relative h-[340px] cursor-pointer select-none sm:h-[300px]"
                  onClick={() => !grading && setFlipped((v) => !v)}
                  role="button"
                  tabIndex={0}
                  aria-label={flipped ? "Show question" : "Reveal answer"}
                >
                  <motion.div
                    className="relative h-full w-full [transform-style:preserve-3d]"
                    animate={{ rotateY: flipped ? 180 : 0 }}
                    transition={{ duration: 0.5, ease: motionEase }}
                  >
                    <div
                      className={cn(
                        "absolute inset-0 flex flex-col items-center justify-center gap-4 overflow-y-auto rounded-2xl",
                        "border border-white/[0.08] bg-white/[0.03] p-8 text-center [backface-visibility:hidden]"
                      )}
                    >
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-indigo-400">
                        Question
                      </span>
                      <p className="text-lg font-medium leading-relaxed text-white">
                        {card.front}
                      </p>
                      <span className="mt-auto flex items-center gap-1.5 text-[11px] text-slate-500">
                        <MousePointerClick className="h-3.5 w-3.5" />
                        Click or press Space to reveal
                      </span>
                    </div>

                    <div
                      className={cn(
                        "absolute inset-0 flex flex-col items-center justify-center gap-3 overflow-y-auto rounded-2xl",
                        "border border-indigo-500/25 bg-[#0c1224] p-8 text-center",
                        "[backface-visibility:hidden] [transform:rotateY(180deg)]"
                      )}
                    >
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-400">
                        Answer
                      </span>
                      <p className="text-lg font-medium leading-relaxed text-white">
                        {card.back}
                      </p>
                      {card.hint && (
                        <p className="flex items-start gap-1.5 text-[12px] leading-relaxed text-slate-400">
                          <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400/80" />
                          {card.hint}
                        </p>
                      )}
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            </AnimatePresence>

            <AnimatePresence>
              {flipped && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 12 }}
                  transition={{ duration: 0.25, ease: motionEase }}
                  className="grid grid-cols-2 gap-2.5 sm:grid-cols-4"
                >
                  {previews.map((g) => (
                    <button
                      key={g.id}
                      type="button"
                      disabled={grading}
                      onClick={() => void onGrade(g.id)}
                      className={cn(
                        "flex flex-col items-center gap-0.5 rounded-xl border px-3 py-3 transition-all",
                        "disabled:cursor-not-allowed disabled:opacity-50",
                        g.className
                      )}
                    >
                      <span className="text-[13px] font-semibold">{g.label}</span>
                      <span className="text-[11px] opacity-70">{g.next}</span>
                      <kbd className="mt-0.5 rounded bg-black/25 px-1.5 text-[10px] opacity-70">
                        {g.key}
                      </kbd>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {!flipped && (
              <p className="text-center text-[11px] text-slate-600">
                <Sparkles className="mr-1 inline h-3 w-3" />
                Grade with keys 1–4 after revealing the answer
              </p>
            )}
          </>
        )}
      </div>
    </DashboardShell>
  );
}

function ResultStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-4">
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="mt-0.5 text-[12px] text-slate-500">{label}</p>
    </div>
  );
}
