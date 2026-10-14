"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import {
  ArrowLeft,
  Check,
  ChevronRight,
  Flag,
  Lightbulb,
  RotateCcw,
  Sparkles,
  X,
} from "lucide-react";
import DashboardShell from "@/components/dashboard/DashboardShell";
import Button from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { saveAttempt } from "@/app/dashboard/quiz/actions";
import { ease } from "@/lib/motion";
import { cn } from "@/lib/utils";
import type { QuizQuestionRow, QuizRow } from "@/lib/study/types";
import { LETTERS, percent, scoreTone } from "./utils";

interface Props {
  quiz: QuizRow;
  questions: QuizQuestionRow[];
}

const PASS_MARK = 60;

export default function TakeQuizClient({ quiz, questions }: Props) {
  const total = questions.length;

  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>(() =>
    questions.map(() => null)
  );
  const [choice, setChoice] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<{ score: number; xp: number } | null>(null);

  const current = questions[index];

  const score = useMemo(
    () =>
      answers.reduce<number>(
        (sum, a, i) => (a !== null && a === questions[i]?.correct_index ? sum + 1 : sum),
        0
      ),
    [answers, questions]
  );

  const finish = useCallback(
    async (finalAnswers: (number | null)[]) => {
      if (saving) return;

      setSaving(true);
      try {
        const finalScore = finalAnswers.reduce<number>(
          (sum, a, i) => (a !== null && a === questions[i]?.correct_index ? sum + 1 : sum),
          0
        );

        const res = await saveAttempt(quiz.id, finalAnswers, finalScore, total);
        if (!res.ok || !res.data) {
          throw new Error(res.error ?? "Could not save the attempt.");
        }

        setResult({ score: finalScore, xp: res.data.xp });
        toast.success("Attempt saved.");
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Could not save the attempt."
        );
      } finally {
        setSaving(false);
      }
    },
    [saving, questions, quiz.id, total]
  );

  const select = useCallback(
    (optionIndex: number) => {
      if (result || revealed || saving) return;
      if (optionIndex >= (current?.options.length ?? 0)) return;

      setChoice(optionIndex);
      setAnswers((prev) => prev.map((v, i) => (i === index ? optionIndex : v)));
      setRevealed(true);
    },
    [result, revealed, saving, current, index]
  );

  const advance = useCallback(() => {
    if (saving || !revealed) return;

    if (index + 1 >= total) {
      void finish(answers);
      return;
    }

    setIndex((i) => i + 1);
    setChoice(null);
    setRevealed(false);
  }, [saving, revealed, index, total, finish, answers]);

  const skip = useCallback(() => {
    if (result || revealed || saving) return;

    const nextAnswers = answers.map((v, i) => (i === index ? null : v));
    setAnswers(nextAnswers);

    if (index + 1 >= total) {
      void finish(nextAnswers);
      return;
    }

    setIndex(index + 1);
  }, [result, revealed, saving, answers, index, total, finish]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (result || saving) return;

      const n = Number(e.key);
      if (Number.isInteger(n) && n >= 1 && n <= 4) {
        select(n - 1);
        return;
      }
      if (e.key === "Enter" && revealed) advance();
    }

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [select, advance, revealed, result, saving]);

  function retake() {
    setIndex(0);
    setAnswers(questions.map(() => null));
    setChoice(null);
    setRevealed(false);
    setResult(null);
  }

  if (result) {
    const pct = percent(result.score, total);
    const passed = pct >= PASS_MARK;

    return (
      <DashboardShell>
        <div className="mx-auto max-w-3xl space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease }}
            className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-8 text-center"
          >
            <div
              className={cn(
                "mx-auto flex h-20 w-20 items-center justify-center rounded-full ring-1",
                passed
                  ? "bg-emerald-500/15 ring-emerald-500/30"
                  : "bg-rose-500/15 ring-rose-500/30"
              )}
            >
              {passed ? (
                <Check className="h-9 w-9 text-emerald-400" />
              ) : (
                <X className="h-9 w-9 text-rose-400" />
              )}
            </div>

            <h1 className="mt-4 text-2xl font-bold text-white">{quiz.title}</h1>
            <p className="mt-1 text-sm text-slate-400">
              {passed
                ? pct >= 80
                  ? "Outstanding — you clearly know this material."
                  : "Passed. Solid work!"
                : "Not there yet — review the explanations and try again."}
            </p>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <span className="text-4xl font-bold text-white">{pct}%</span>
              <Badge tone={scoreTone(pct)}>
                {result.score}/{total} correct
              </Badge>
              <Badge tone="indigo">
                <Sparkles className="h-3 w-3" />
                +{result.xp} XP
              </Badge>
            </div>

            <div className="mt-7 flex flex-wrap items-center justify-center gap-2">
              <Button onClick={retake}>
                <RotateCcw className="h-4 w-4" />
                Retake quiz
              </Button>
              <Link
                href={`/dashboard/quiz/${quiz.id}`}
                className={cn(
                  "inline-flex h-10 items-center gap-2 rounded-xl border border-white/10",
                  "bg-white/5 px-4 text-sm font-medium text-slate-200",
                  "transition-all hover:border-white/20 hover:bg-white/10 hover:text-white"
                )}
              >
                <ArrowLeft className="h-4 w-4" />
                Back to quiz
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease, delay: 0.15 }}
            className="space-y-3"
          >
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
              Review
            </h2>

            {questions.map((q, qi) => {
              const given = answers[qi];
              const correct = given === q.correct_index;

              return (
                <div
                  key={q.id}
                  className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5"
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={cn(
                        "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full",
                        correct
                          ? "bg-emerald-500/15 text-emerald-400"
                          : "bg-rose-500/15 text-rose-400"
                      )}
                    >
                      {correct ? (
                        <Check className="h-3.5 w-3.5" />
                      ) : (
                        <X className="h-3.5 w-3.5" />
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium leading-relaxed text-white">
                        <span className="mr-2 text-slate-500">{qi + 1}.</span>
                        {q.question}
                      </p>

                      <div className="mt-2.5 space-y-1.5 text-[13px]">
                        {given === null ? (
                          <p className="text-slate-500">
                            <Flag className="mr-1.5 inline h-3.5 w-3.5" />
                            Skipped
                          </p>
                        ) : (
                          <p className={correct ? "text-emerald-400" : "text-rose-400"}>
                            Your answer: {LETTERS[given]}. {q.options[given]}
                          </p>
                        )}
                        {!correct && (
                          <p className="text-emerald-400">
                            Correct: {LETTERS[q.correct_index]}.{" "}
                            {q.options[q.correct_index]}
                          </p>
                        )}
                      </div>

                      {q.explanation && (
                        <p className="mt-2.5 flex items-start gap-2 text-[12px] italic leading-relaxed text-slate-400">
                          <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400/70" />
                          {q.explanation}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </motion.div>
        </div>
      </DashboardShell>
    );
  }

  const isLast = index + 1 >= total;
  const isCorrectChoice = choice !== null && choice === current?.correct_index;

  return (
    <DashboardShell>
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href={`/dashboard/quiz/${quiz.id}`}
            className="inline-flex items-center gap-1.5 text-[13px] text-slate-400 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Quit attempt
          </Link>
          <div className="flex items-center gap-3">
            <span className="text-[12px] text-slate-400">
              Score: <span className="font-semibold text-white">{score}</span>
            </span>
            <span className="text-[12px] text-slate-500">
              Press <kbd className="rounded border border-white/10 bg-white/5 px-1 py-0.5 text-[10px] text-slate-300">1–4</kbd> to answer
            </span>
          </div>
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between text-[12px] text-slate-400">
            <span className="font-medium text-white">
              Question {index + 1} of {total}
            </span>
            <span>{quiz.title}</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
            <motion.div
              className="btn-gradient h-full rounded-full"
              initial={false}
              animate={{ width: `${((index + 1) / total) * 100}%` }}
              transition={{ duration: 0.35, ease }}
            />
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={current?.id ?? index}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.25, ease }}
            className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6"
          >
            <p className="text-[15px] font-medium leading-relaxed text-white">
              {current?.question}
            </p>

            <div className="mt-5 space-y-2.5">
              {current?.options.map((option, oi) => {
                const chosen = choice === oi;
                const isAnswer = oi === current.correct_index;

                return (
                  <button
                    key={oi}
                    type="button"
                    disabled={revealed || saving}
                    onClick={() => select(oi)}
                    className={cn(
                      "flex w-full items-start gap-3 rounded-xl border px-4 py-3 text-left",
                      "text-[13px] leading-relaxed transition-all duration-200",
                      !revealed &&
                        "border-white/10 bg-white/[0.03] text-slate-300 hover:border-indigo-400/40 hover:bg-white/[0.06] hover:text-white",
                      revealed && isAnswer && "border-emerald-500/40 bg-emerald-500/10 text-emerald-300",
                      revealed && chosen && !isAnswer && "border-rose-500/40 bg-rose-500/10 text-rose-300",
                      revealed && !chosen && !isAnswer && "border-white/[0.06] bg-white/[0.02] text-slate-500 opacity-60",
                      (revealed || saving) && "cursor-default"
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold",
                        revealed && isAnswer
                          ? "bg-emerald-500/20 text-emerald-300"
                          : revealed && chosen && !isAnswer
                            ? "bg-rose-500/20 text-rose-300"
                            : "bg-white/[0.06] text-slate-400"
                      )}
                    >
                      {LETTERS[oi] ?? oi + 1}
                    </span>
                    <span className="flex-1">{option}</span>
                    {revealed && isAnswer && (
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                    )}
                    {revealed && chosen && !isAnswer && (
                      <X className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
                    )}
                  </button>
                );
              })}
            </div>

            <AnimatePresence initial={false}>
              {revealed && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25 }}
                  className="overflow-hidden"
                >
                  <div
                    className={cn(
                      "mt-4 rounded-xl border p-4",
                      isCorrectChoice
                        ? "border-emerald-500/25 bg-emerald-500/8"
                        : "border-indigo-500/25 bg-indigo-500/8"
                    )}
                  >
                    <p
                      className={cn(
                        "text-[13px] font-semibold",
                        isCorrectChoice ? "text-emerald-300" : "text-indigo-300"
                      )}
                    >
                      {isCorrectChoice ? "Correct!" : "Not quite."}
                    </p>
                    {current?.explanation && (
                      <p className="mt-1 text-[13px] leading-relaxed text-slate-300">
                        {current.explanation}
                      </p>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </AnimatePresence>

        <div className="flex items-center justify-between gap-3">
          {!revealed ? (
            <Button variant="ghost" onClick={skip} disabled={saving}>
              <Flag className="h-4 w-4" />
              Skip question
            </Button>
          ) : (
            <span />
          )}

          <Button onClick={advance} disabled={!revealed || saving} loading={saving && isLast}>
            {isLast ? "Finish" : "Next question"}
            {!isLast && <ChevronRight className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </DashboardShell>
  );
}
