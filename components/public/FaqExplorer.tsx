"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { ease } from "@/lib/motion";

export interface FaqItem {
  category: string;
  question: string;
  answer: string;
}

interface FaqExplorerProps {
  faqs: FaqItem[];
  categories: string[];
}

export default function FaqExplorer({ faqs, categories }: FaqExplorerProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState<string | null>(null);

  const grouped = useMemo(() => {
    const q = query.trim().toLowerCase();
    const matches = faqs.filter(
      (f) =>
        q === "" ||
        f.question.toLowerCase().includes(q) ||
        f.answer.toLowerCase().includes(q)
    );
    return categories
      .map((category) => ({
        category,
        items: matches.filter((f) => f.category === category),
      }))
      .filter((group) => group.items.length > 0);
  }, [faqs, categories, query]);

  const totalMatches = grouped.reduce((n, g) => n + g.items.length, 0);

  return (
    <div>
      <div className="relative mx-auto max-w-xl">
        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for answers... (e.g. flashcards, delete, PDF)"
          className="w-full rounded-2xl border border-white/[0.08] bg-white/[0.03] py-3.5 pl-11 pr-4 text-sm text-white outline-none placeholder:text-slate-500 focus:border-indigo-500/50"
        />
      </div>

      {totalMatches === 0 ? (
        <p className="mt-14 text-center text-slate-500">
          Nothing matched &ldquo;{query}&rdquo;. Try broader terms, or reach us
          through the contact options below.
        </p>
      ) : (
        <div className="mt-12 space-y-10">
          {grouped.map((group) => (
            <div key={group.category}>
              <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-indigo-400">
                {group.category}
              </h2>
              <div className="mt-4 space-y-3">
                {group.items.map((item) => {
                  const isOpen = open === item.question;
                  return (
                    <div
                      key={item.question}
                      className="overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.03]"
                    >
                      <button
                        onClick={() => setOpen(isOpen ? null : item.question)}
                        aria-expanded={isOpen}
                        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                      >
                        <span
                          className={cn(
                            "text-[15px] font-medium transition-colors",
                            isOpen ? "text-indigo-300" : "text-white"
                          )}
                        >
                          {item.question}
                        </span>
                        <motion.span
                          animate={{ rotate: isOpen ? 180 : 0 }}
                          transition={{ duration: 0.25, ease }}
                          className="shrink-0 text-slate-500"
                        >
                          <ChevronDown className="h-4 w-4" />
                        </motion.span>
                      </button>
                      <AnimatePresence initial={false}>
                        {isOpen && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3, ease }}
                          >
                            <p className="border-t border-white/[0.06] px-5 py-4 text-sm leading-relaxed text-slate-400">
                              {item.answer}
                            </p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
