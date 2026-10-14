"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, Send, Loader2, AlertCircle, ChevronDown, ChevronUp, ExternalLink, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { fadeUp } from "@/lib/motion";
import type { AIAdvisorResponse } from "@/lib/scholarships/types";

interface AIAdvisorProps {
  scholarshipId: string;
  scholarshipName: string;
}

const QUICK_QUESTIONS = [
  "Am I eligible for this scholarship?",
  "What documents do I need to prepare?",
  "What makes a strong application?",
  "What is the selection criteria?",
];

export default function AIAdvisor({ scholarshipId, scholarshipName }: AIAdvisorProps) {
  const [open, setOpen]           = useState(false);
  const [question, setQuestion]   = useState("");
  const [loading, setLoading]     = useState(false);
  const [response, setResponse]   = useState<AIAdvisorResponse | null>(null);
  const [error, setError]         = useState<string | null>(null);
  const [lastAsked, setLastAsked] = useState<string>("");

  async function ask(q: string) {
    const trimmed = q.trim();
    if (!trimmed || loading) return;

    setLoading(true);
    setError(null);
    setResponse(null);
    setLastAsked(trimmed);
    setQuestion("");

    try {
      const res = await fetch("/api/scholarships/ai-advisor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: trimmed,
          scholarship_ids: [scholarshipId],
        }),
      });

      const body = await res.json();

      if (!res.ok) {
        throw new Error(body?.error?.message ?? "AI advisor unavailable. Please try again.");
      }

      setResponse(body.data as AIAdvisorResponse);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setResponse(null);
    setError(null);
    setQuestion("");
    setLastAsked("");
  }

  // Show quick questions when: not loading, no response yet (includes error state)
  const showQuickQuestions = !loading && !response;
  // Show input when: not loading and no response
  const showInput = !loading && !response;

  return (
    <div className="glass-strong rounded-2xl overflow-hidden">
      {/* Header toggle */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between p-5 text-left"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/15 border border-indigo-500/25">
            <Bot className="h-4 w-4 text-indigo-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">AI Scholarship Advisor</h3>
            <p className="text-xs text-slate-400">Ask about eligibility, documents & tips</p>
          </div>
        </div>
        {open ? (
          <ChevronUp className="h-4 w-4 text-slate-400" />
        ) : (
          <ChevronDown className="h-4 w-4 text-slate-400" />
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="border-t border-white/8 p-5 space-y-4">

              {/* Disclaimer */}
              <p className="rounded-lg border border-amber-500/20 bg-amber-500/8 px-3 py-2 text-xs text-amber-300/80">
                AI advice is grounded in verified scholarship data only. Always confirm details on the official website.
              </p>

              {/* Loading */}
              <AnimatePresence mode="wait">
                {loading && (
                  <motion.div
                    key="loading"
                    variants={fadeUp}
                    initial="hidden"
                    animate="show"
                    exit="hidden"
                    className="flex items-center gap-2 text-sm text-slate-400"
                  >
                    <Loader2 className="h-4 w-4 animate-spin text-indigo-400" />
                    Analyzing {scholarshipName}…
                  </motion.div>
                )}

                {/* Error */}
                {error && !loading && (
                  <motion.div
                    key="error"
                    variants={fadeUp}
                    initial="hidden"
                    animate="show"
                    className="space-y-3"
                  >
                    <div className="flex items-start gap-2 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300">
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                      <div className="flex-1">
                        <p>{error}</p>
                        {lastAsked && (
                          <p className="mt-1 text-xs text-red-300/60">
                            Question: &ldquo;{lastAsked}&rdquo;
                          </p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => lastAsked && ask(lastAsked)}
                      className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                    >
                      <RefreshCw className="h-3 w-3" />
                      Try again
                    </button>
                  </motion.div>
                )}

                {/* Response */}
                {response && !loading && (
                  <motion.div
                    key="response"
                    variants={fadeUp}
                    initial="hidden"
                    animate="show"
                    className="space-y-3"
                  >
                    {/* Main recommendation */}
                    <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/8 p-4">
                      <p className="text-sm leading-relaxed text-slate-200">
                        {response.recommendation}
                      </p>
                    </div>

                    {/* Matching points */}
                    {response.why_it_matches?.length > 0 && (
                      <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/8 p-3">
                        <p className="mb-1.5 text-xs font-semibold text-emerald-400">✓ Why it could match you</p>
                        {response.why_it_matches.map((p, i) => (
                          <p key={i} className="text-xs text-emerald-300/80">• {p}</p>
                        ))}
                      </div>
                    )}

                    {/* Issues */}
                    {response.potential_issues?.length > 0 && (
                      <div className="rounded-lg border border-amber-500/20 bg-amber-500/8 p-3">
                        <p className="mb-1.5 text-xs font-semibold text-amber-400">⚠ Watch out for</p>
                        {response.potential_issues.map((p, i) => (
                          <p key={i} className="text-xs text-amber-300/80">• {p}</p>
                        ))}
                      </div>
                    )}

                    {/* Missing info */}
                    {response.missing_info?.length > 0 && (
                      <div className="rounded-lg border border-slate-500/20 bg-slate-500/8 p-3">
                        <p className="mb-1.5 text-xs font-semibold text-slate-400">ℹ Complete your profile</p>
                        {response.missing_info.map((p, i) => (
                          <p key={i} className="text-xs text-slate-400">• {p}</p>
                        ))}
                      </div>
                    )}

                    {/* Official sources */}
                    {response.official_sources?.length > 0 && (
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-slate-400">Official sources</p>
                        {response.official_sources.map((s, i) => (
                          <a
                            key={i}
                            href={s.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                          >
                            <ExternalLink className="h-3 w-3" />
                            {s.name}
                          </a>
                        ))}
                      </div>
                    )}

                    {/* Disclaimer */}
                    {response.disclaimer && (
                      <p className="text-xs text-slate-500">{response.disclaimer}</p>
                    )}

                    {/* Ask another */}
                    <button
                      onClick={reset}
                      className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                    >
                      <RefreshCw className="h-3 w-3" />
                      Ask another question
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Quick questions — always shown when not loading and no response */}
              {showQuickQuestions && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-slate-400">Quick questions</p>
                  <div className="flex flex-wrap gap-2">
                    {QUICK_QUESTIONS.map((q) => (
                      <button
                        key={q}
                        onClick={() => ask(q)}
                        disabled={loading}
                        className={cn(
                          "rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-300",
                          "hover:border-indigo-500/40 hover:bg-indigo-500/10 hover:text-white transition-all",
                          "disabled:opacity-50 disabled:cursor-not-allowed"
                        )}
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Text input */}
              {showInput && (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") ask(question);
                    }}
                    placeholder="Ask a question about this scholarship..."
                    disabled={loading}
                    className={cn(
                      "flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white",
                      "placeholder:text-slate-500 focus:border-indigo-500/50 focus:outline-none",
                      "focus:ring-2 focus:ring-indigo-500/20 transition-all duration-200",
                      "disabled:opacity-50"
                    )}
                  />
                  <button
                    onClick={() => ask(question)}
                    disabled={!question.trim() || loading}
                    className={cn(
                      "flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium",
                      "btn-gradient transition-all duration-200",
                      "hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
                    )}
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
              )}

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
