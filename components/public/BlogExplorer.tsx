"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ArrowRight, CalendarDays, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { ease } from "@/lib/motion";

export interface PostMeta {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  author?: string;
  date: string;
  readingTime: number;
}

interface BlogExplorerProps {
  posts: PostMeta[];
  categories: string[];
  basePath?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function BlogExplorer({
  posts,
  categories,
  basePath = "/blog",
  searchPlaceholder = "Search articles...",
  emptyMessage = "No articles match your search. Try a different keyword or category.",
}: BlogExplorerProps) {
  const [category, setCategory] = useState("All");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return posts.filter(
      (post) =>
        (category === "All" || post.category === category) &&
        (q === "" ||
          post.title.toLowerCase().includes(q) ||
          post.excerpt.toLowerCase().includes(q))
    );
  }, [posts, category, query]);

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {["All", ...categories].map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={cn(
                "rounded-full border px-4 py-1.5 text-[13px] font-medium transition-colors",
                category === c
                  ? "border-indigo-500/50 bg-indigo-500/15 text-indigo-300"
                  : "border-white/[0.08] bg-white/[0.03] text-slate-400 hover:border-white/20 hover:text-white"
              )}
            >
              {c}
            </button>
          ))}
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] py-2.5 pl-10 pr-4 text-sm text-white outline-none placeholder:text-slate-500 focus:border-indigo-500/50"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="mt-16 text-center text-slate-500">
          {emptyMessage}
        </p>
      ) : (
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {filtered.map((post) => (
              <motion.article
                key={post.slug}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.4, ease }}
              >
                <Link
                  href={`${basePath}/${post.slug}`}
                  className="group flex h-full flex-col rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5 transition-colors hover:border-indigo-500/40 hover:bg-white/[0.05]"
                >
                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span className="rounded-full border border-indigo-500/30 bg-indigo-500/10 px-2.5 py-0.5 font-medium text-indigo-300">
                      {post.category}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <CalendarDays className="h-3 w-3" />
                      {formatDate(post.date)}
                    </span>
                  </div>
                  <h3 className="mt-4 text-lg font-semibold leading-snug text-white transition-colors group-hover:text-indigo-300">
                    {post.title}
                  </h3>
                  <p className="mt-2.5 flex-1 text-sm leading-relaxed text-slate-400">
                    {post.excerpt}
                  </p>
                  <div className="mt-5 flex items-center justify-between border-t border-white/[0.06] pt-4 text-xs text-slate-500">
                    <span className="inline-flex items-center gap-1.5">
                      <Clock className="h-3 w-3" />
                      {post.readingTime} min read
                      {post.author ? ` · ${post.author}` : ""}
                    </span>
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                  </div>
                </Link>
              </motion.article>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
