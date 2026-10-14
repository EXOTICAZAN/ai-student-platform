"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, MessageSquare, Map, Trophy, BookOpen, CheckCircle2 } from "lucide-react";

type Phase =
  | "idle"
  | "user"
  | "typing"
  | "reply"
  | "roadmap"
  | "scholarships"
  | "plan"
  | "done";

const USER_MSG = "I want to become an AI Engineer.";
const AI_REPLY =
  "Great goal. I'll build a personalized path: courses, projects, scholarships, and a weekly plan.";

export default function LiveChat() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [displayed, setDisplayed] = useState("");
  const [loop, setLoop] = useState(0);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    const later = (fn: () => void, ms: number) => {
      timers.push(setTimeout(fn, ms));
    };

    // Reset state asynchronously to avoid triggering a cascading render synchronously in the effect
    later(() => {
      setPhase("idle");
      setDisplayed("");
    }, 0);

    later(() => setPhase("user"), 500);
    later(() => setPhase("typing"), 1600);
    later(() => {
      setPhase("reply");
      let i = 0;
      const type = () => {
        if (i <= AI_REPLY.length) {
          setDisplayed(AI_REPLY.slice(0, i));
          i++;
          later(type, 16 + Math.random() * 18);
        } else {
          later(() => setPhase("roadmap"), 700);
          later(() => setPhase("scholarships"), 2000);
          later(() => setPhase("plan"), 3400);
          later(() => setPhase("done"), 4800);
          later(() => setLoop((l) => l + 1), 7200);
        }
      };
      type();
    }, 2600);

    return () => timers.forEach(clearTimeout);
  }, [loop]);

  const showRoadmap = ["roadmap", "scholarships", "plan", "done"].includes(phase);
  const showScholarships = ["scholarships", "plan", "done"].includes(phase);
  const showPlan = ["plan", "done"].includes(phase);

  return (
    <div className="space-y-3.5">
      {/* User bubble */}
      <AnimatePresence>
        {phase !== "idle" && (
          <motion.div
            key={`u-${loop}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-2.5"
          >
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-cyan-400/20">
              <MessageSquare className="h-3.5 w-3.5 text-cyan-300" />
            </div>
            <div className="rounded-2xl rounded-tl-sm bg-white/[0.07] px-3.5 py-2.5 text-[12px] text-slate-300">
              {USER_MSG}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Typing */}
      <AnimatePresence>
        {phase === "typing" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-2 pl-9"
          >
            <div className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="h-1.5 w-1.5 rounded-full bg-cyan-300"
                  animate={{ opacity: [0.25, 1, 0.25], y: [0, -2.5, 0] }}
                  transition={{ duration: 0.85, repeat: Infinity, delay: i * 0.14 }}
                />
              ))}
            </div>
            <span className="text-[10px] text-slate-500">AI is thinking…</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* AI reply */}
      <AnimatePresence>
        {["reply", "roadmap", "scholarships", "plan", "done"].includes(phase) && (
          <motion.div
            key={`a-${loop}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-2.5"
          >
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-400/15">
              <Brain className="h-3.5 w-3.5 text-amber-200" />
            </div>
            <div className="rounded-2xl rounded-tl-sm bg-gradient-to-br from-cyan-400/15 to-amber-400/10 px-3.5 py-2.5 text-[12px] leading-relaxed text-slate-200">
              {displayed}
              {phase === "reply" && (
                <motion.span
                  animate={{ opacity: [1, 0] }}
                  transition={{ duration: 0.55, repeat: Infinity }}
                  className="ml-0.5 inline-block h-3 w-[2px] bg-indigo-300 align-middle"
                />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Roadmap card */}
      <AnimatePresence>
        {showRoadmap && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="ml-9 rounded-xl border border-cyan-300/20 bg-cyan-400/10 p-3"
          >
            <div className="mb-2 flex items-center gap-2 text-[11px] font-medium text-cyan-200">
              <Map className="h-3.5 w-3.5" />
              AI Engineer Roadmap
            </div>
            <div className="flex gap-1.5">
              {["Math", "Python", "ML", "DL", "Projects"].map((step, i) => (
                <motion.div
                  key={step}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.15 * i }}
                  className="flex-1 rounded-md bg-white/10 py-1 text-center text-[9px] text-slate-300"
                >
                  {step}
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Scholarships */}
      <AnimatePresence>
        {showScholarships && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="ml-9 rounded-xl border border-amber-500/20 bg-amber-500/10 p-3"
          >
            <div className="mb-2 flex items-center gap-2 text-[11px] font-medium text-amber-300">
              <Trophy className="h-3.5 w-3.5" />
              3 scholarships matched
            </div>
            <div className="space-y-1.5">
              {["Google AI Scholarship", "DeepMind Fellowship", "MIT Open Masters"].map(
                (s, i) => (
                  <motion.div
                    key={s}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.12 * i }}
                    className="flex items-center justify-between text-[10px] text-slate-300"
                  >
                    <span>{s}</span>
                    <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-emerald-300">
                      {90 - i * 4}%
                    </span>
                  </motion.div>
                )
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Plan */}
      <AnimatePresence>
        {showPlan && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="ml-9 flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2.5 text-[11px] text-emerald-200"
          >
            <BookOpen className="h-3.5 w-3.5" />
            Weekly plan ready · 12 hrs focused study
            <CheckCircle2 className="ml-auto h-3.5 w-3.5 text-emerald-400" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
