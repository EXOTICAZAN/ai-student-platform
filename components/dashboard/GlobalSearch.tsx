"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Search, Loader2, NotebookPen, Layers, HelpCircle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SearchHit } from "@/app/api/search/route";

const KIND_ICON = {
  Note: NotebookPen,
  Deck: Layers,
  Quiz: HelpCircle,
  Task: CheckCircle2,
} as const;

const KIND_TONE = {
  Note: "text-emerald-400 bg-emerald-500/15",
  Deck: "text-purple-400 bg-purple-500/15",
  Quiz: "text-sky-400 bg-sky-500/15",
  Task: "text-teal-400 bg-teal-500/15",
} as const;

export default function GlobalSearch() {
  const router = useRouter();
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchHit[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(0);
  const [failed, setFailed] = useState(false);

  const runSearch = useCallback(async (term: string) => {
    const res = await fetch(`/api/search?q=${encodeURIComponent(term)}`);
    if (!res.ok) throw new Error("search failed");

    const json = (await res.json()) as {
      data: { results: SearchHit[] } | null;
      error?: { message?: string };
    };

    if (!json.data) throw new Error(json.error?.message ?? "search failed");
    return json.data.results;
  }, []);

  // Debounced fetch; the cancelled flag drops out-of-order responses.
  useEffect(() => {
    const term = query.trim();
    if (term.length < 2) return;

    let cancelled = false;

    const timer = setTimeout(async () => {
      if (cancelled) return;
      setLoading(true);

      try {
        const hits = await runSearch(term);
        if (cancelled) return;
        setResults(hits);
        setFailed(false);
        setActive(0);
        setOpen(true);
      } catch {
        if (cancelled) return;
        setResults([]);
        setFailed(true);
        setOpen(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, runSearch]);

  useEffect(() => {
    function onClickAway(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }

    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
    }

    document.addEventListener("mousedown", onClickAway);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClickAway);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  function go(href: string) {
    setOpen(false);
    setQuery("");
    inputRef.current?.blur();
    router.push(href);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") {
      setOpen(false);
      return;
    }
    if (!open || results.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => (i + 1) % results.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => (i - 1 + results.length) % results.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      const hit = results[active];
      if (hit) go(hit.href);
    }
  }

  const showPanel = open && query.trim().length >= 2;

  return (
    <div className="relative max-w-md flex-1" ref={wrapRef}>
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
      <input
        ref={inputRef}
        type="search"
        value={query}
        onChange={(e) => {
          const value = e.target.value;
          setQuery(value);

          if (value.trim().length < 2) {
            setResults([]);
            setLoading(false);
            setFailed(false);
            setOpen(false);
          }
        }}
        onFocus={() => query.trim().length >= 2 && setOpen(true)}
        onKeyDown={onKeyDown}
        placeholder="Search notes, decks, quizzes, tasks…"
        aria-label="Search your study library"
        role="combobox"
        aria-expanded={showPanel}
        aria-controls="global-search-results"
        className="w-full rounded-xl border border-white/10 bg-white/[0.04] py-2.5 pl-10 pr-10 text-sm text-white outline-none transition-all placeholder:text-slate-500 focus:border-indigo-500/40 focus:bg-white/[0.06] focus:ring-2 focus:ring-indigo-500/20"
      />

      {loading && (
        <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-slate-500" />
      )}
      {!loading && (
        <kbd className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 rounded border border-white/10 bg-white/[0.04] px-1.5 py-0.5 text-[10px] text-slate-500 sm:block">
          ⌘K
        </kbd>
      )}

      <AnimatePresence>
        {showPanel && (
          <motion.div
            id="global-search-results"
            role="listbox"
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-white/10 bg-[#0c1224] shadow-2xl"
          >
            {failed ? (
              <p className="px-4 py-6 text-center text-[13px] text-slate-500">
                Search is unavailable right now.
              </p>
            ) : results.length === 0 ? (
              <p className="px-4 py-6 text-center text-[13px] text-slate-500">
                No matches for “{query.trim()}”.
              </p>
            ) : (
              <ul className="max-h-80 overflow-y-auto p-1.5">
                {results.map((hit, i) => {
                  const Icon = KIND_ICON[hit.kind];

                  return (
                    <li key={`${hit.kind}-${hit.id}`}>
                      <button
                        type="button"
                        role="option"
                        aria-selected={i === active}
                        onMouseEnter={() => setActive(i)}
                        onClick={() => go(hit.href)}
                        className={cn(
                          "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors",
                          i === active ? "bg-white/[0.06]" : "hover:bg-white/[0.04]"
                        )}
                      >
                        <span
                          className={cn(
                            "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                            KIND_TONE[hit.kind]
                          )}
                        >
                          <Icon className="h-4 w-4" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[13px] font-medium text-slate-100">
                            {hit.title}
                          </span>
                          <span className="block truncate text-[11px] text-slate-500">
                            {hit.subtitle || hit.kind}
                          </span>
                        </span>
                        <span className="shrink-0 text-[10px] uppercase tracking-wider text-slate-600">
                          {hit.kind}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
