"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  BookOpen,
  Check,
  Circle,
  Dumbbell,
  RotateCcw,
  ScanSearch,
  Timer,
} from "lucide-react";

const studySteps = [
  { label: "Read", icon: BookOpen },
  { label: "Practice", icon: Dumbbell },
  { label: "Review", icon: ScanSearch },
] as const;

function formatElapsed(seconds: number) {
  const minutes = Math.floor(seconds / 60).toString().padStart(2, "0");
  const remainder = (seconds % 60).toString().padStart(2, "0");
  return `${minutes}:${remainder}`;
}

/**
 * A small, transparent study-session trace. It shows only explicit learner
 * actions and never represents private model reasoning or hidden thoughts.
 */
export default function ThoughtLine() {
  const [elapsed, setElapsed] = useState(0);
  const [completed, setCompleted] = useState(false);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (completed) return;

    const interval = window.setInterval(() => {
      setElapsed((current) => current + 1);
    }, 1000);

    return () => window.clearInterval(interval);
  }, [completed]);

  const reset = () => {
    setElapsed(0);
    setCompleted(false);
  };

  return (
    <div
      className="rounded-3xl border border-cyan-100/[0.11] bg-[#071b2a]/65 p-5 shadow-[0_18px_70px_-35px_rgba(99,239,255,0.7)] sm:p-6"
      aria-label="Study flow session trace"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-300">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-300 shadow-[0_0_12px_rgba(99,239,255,0.9)]" />
            Study flow
          </div>
          <p className="mt-2 text-sm leading-relaxed text-slate-300">
            A simple progress trace for this session — clear, visible, and yours.
          </p>
        </div>
        <div className="shrink-0 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1.5 text-xs tabular-nums text-slate-300" aria-label={`Elapsed time ${formatElapsed(elapsed)}`}>
          <Timer className="mr-1.5 inline-block h-3.5 w-3.5 text-cyan-300" aria-hidden="true" />
          <span aria-live="polite">{formatElapsed(elapsed)}</span>
        </div>
      </div>

      <AnimatePresence mode="wait" initial={false}>
        {!completed ? (
          <motion.div
            key="steps"
            initial={reduceMotion ? false : { opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={reduceMotion ? undefined : { opacity: 0, height: 0 }}
            transition={{ duration: 0.35 }}
            className="overflow-hidden"
          >
            <div className="mt-6 flex items-center gap-2 sm:gap-3" aria-label="Study flow steps">
              {studySteps.map((step, index) => {
                const Icon = step.icon;
                return (
                  <div key={step.label} className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-cyan-300/30 bg-cyan-300/10 text-cyan-200">
                        <Icon className="h-4 w-4" aria-hidden="true" />
                      </span>
                      <span className="truncate text-xs font-medium text-slate-200">{step.label}</span>
                    </div>
                    {index < studySteps.length - 1 && <span className="h-px min-w-2 flex-1 bg-gradient-to-r from-cyan-300/35 to-white/10" aria-hidden="true" />}
                  </div>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => setCompleted(true)}
              className="mt-6 inline-flex min-h-10 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-cyan-300 via-cyan-400 to-amber-300 px-4 text-sm font-semibold text-[#031018] transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200 focus-visible:ring-offset-2 focus-visible:ring-offset-[#071b2a]"
            >
              <Check className="h-4 w-4" aria-hidden="true" />
              Complete session
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="complete"
            initial={reduceMotion ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-300/20 bg-emerald-300/[0.07] px-3 py-2.5"
            role="status"
          >
            <div className="flex min-w-0 items-center gap-2 text-sm text-emerald-100">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-300/20 text-emerald-200">
                <Check className="h-3.5 w-3.5" aria-hidden="true" />
              </span>
              <span className="truncate">Read · Practice · Review</span>
              <span className="text-xs text-emerald-200/65">done</span>
            </div>
            <button
              type="button"
              onClick={reset}
              className="inline-flex min-h-8 items-center gap-1.5 rounded-full px-2.5 text-xs font-medium text-slate-300 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200"
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
              New session
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <p className="mt-4 flex items-center gap-1.5 text-[11px] text-slate-500">
        <Circle className="h-2.5 w-2.5 fill-cyan-300/50 text-cyan-300/50" aria-hidden="true" />
        Your progress, at a glance.
      </p>
    </div>
  );
}
