"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowUp, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { fadeUp, stagger } from "@/lib/motion";
import { startChat } from "@/app/dashboard/tutor/actions";
import { stashPendingPrompt } from "@/components/chat/pending-prompt";
import { useLanguage } from "@/components/i18n/LanguageProvider";

const SUGGESTIONS = [
  "Explain backpropagation like I'm a beginner",
  "Quiz me on organic chemistry reaction mechanisms",
  "Help me plan a 2-week revision schedule for linear algebra",
  "What's the difference between SQL joins? Give examples",
];

interface NewChatPanelProps {
  userName: string;
}

export default function NewChatPanel({ userName }: NewChatPanelProps) {
  const router = useRouter();
  const { t } = useLanguage();
  const [draft, setDraft] = useState("");
  const [pending, startTransition] = useTransition();

  function send(text: string) {
    const prompt = text.trim();
    if (!prompt || pending) return;

    setDraft("");

    startTransition(async () => {
      const res = await startChat(prompt);
      if (!res.ok || !res.data) {
        toast.error(res.error ?? "Could not start a chat.");
        setDraft(prompt);
        return;
      }

      // Handed to ChatInput on the next page, which consumes it immediately.
      stashPendingPrompt(res.data.id, prompt);

      router.push(`/dashboard/tutor/${res.data.id}`);
    });
  }

  return (
    <div className="flex h-full flex-col items-center justify-center px-4 py-10">
      <motion.div
        variants={stagger}
        initial="hidden"
        animate="show"
        className="w-full max-w-2xl"
      >
        <motion.div variants={fadeUp} className="text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-[12px] font-medium text-indigo-300">
            <Sparkles className="h-3.5 w-3.5" />
            {t("tutor")}
          </span>
          <h1 className="mt-4 text-2xl font-bold tracking-tight text-white sm:text-3xl">
            {t("whatLearn")}, {userName.split(" ")[0]}?
          </h1>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate-400">
            Ask a question, request an explanation, or paste a problem you are
            stuck on. Your conversation is saved so you can pick it up later.
          </p>
        </motion.div>

        <motion.div
          variants={fadeUp}
          className="mt-8 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-3 focus-within:border-indigo-500/40"
        >
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send(draft);
              }
            }}
            rows={3}
            placeholder={t("askAnythingPlaceholder")}
            aria-label="Your first message"
            className="w-full resize-none bg-transparent px-2 py-1.5 text-sm text-white outline-none placeholder:text-slate-500"
          />

          <div className="mt-2 flex items-center justify-between gap-3 border-t border-white/[0.06] pt-2.5">
            <span className="px-2 text-[11px] text-slate-600">
              {t("enterSend")}
            </span>
            <button
              type="button"
              onClick={() => send(draft)}
              disabled={pending || !draft.trim()}
              aria-label="Start the conversation"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white transition-colors hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-white/[0.06] disabled:text-slate-600"
            >
              {pending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ArrowUp className="h-4 w-4" />
              )}
            </button>
          </div>
        </motion.div>

        <motion.div variants={fadeUp} className="mt-6 flex flex-wrap justify-center gap-2">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => send(s)}
              disabled={pending}
              className="rounded-full border border-white/[0.08] bg-white/[0.03] px-3.5 py-1.5 text-[12px] text-slate-400 transition-colors hover:border-indigo-500/40 hover:text-white disabled:opacity-50"
            >
              {s}
            </button>
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
}
