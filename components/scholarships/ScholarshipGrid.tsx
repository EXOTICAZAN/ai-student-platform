"use client";

import { ChevronLeft, ChevronRight, Search, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { stagger } from "@/lib/motion";
import type { ScholarshipSummary } from "@/lib/scholarships/types";
import ScholarshipCard from "./ScholarshipCard";

// ------------------------------------------------------------------
// Loading skeleton card
// ------------------------------------------------------------------

function SkeletonCard() {
  return (
    <div className="glass-strong animate-pulse rounded-2xl p-5 space-y-3">
      <div className="flex gap-2">
        <div className="h-5 w-24 rounded-full bg-white/8" />
        <div className="h-5 w-20 rounded-full bg-white/8" />
      </div>
      <div className="h-4 w-3/4 rounded bg-white/8" />
      <div className="h-3 w-1/2 rounded bg-white/6" />
      <div className="mt-4 space-y-1.5">
        <div className="h-3 w-full rounded bg-white/6" />
        <div className="h-3 w-2/3 rounded bg-white/6" />
      </div>
      <div className="mt-4 h-10 w-full rounded-xl bg-white/6" />
    </div>
  );
}

// ------------------------------------------------------------------
// Empty state
// ------------------------------------------------------------------

function EmptyState({ hasFilters }: { hasFilters: boolean }) {
  return (
    <div className="col-span-full flex flex-col items-center justify-center py-20 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-500/10 border border-indigo-500/20">
        {hasFilters ? (
          <Search className="h-7 w-7 text-indigo-400" />
        ) : (
          <Trophy className="h-7 w-7 text-indigo-400" />
        )}
      </div>
      <h3 className="mb-2 text-lg font-semibold text-white">
        {hasFilters ? "No scholarships match your filters" : "No scholarships yet"}
      </h3>
      <p className="max-w-xs text-sm text-slate-400">
        {hasFilters
          ? "Try adjusting your search or filters to find more scholarships."
          : "Check back soon — new scholarships are added regularly."}
      </p>
    </div>
  );
}

// ------------------------------------------------------------------
// Pagination
// ------------------------------------------------------------------

function Pagination({
  page,
  total,
  pageSize,
  onPage,
}: {
  page: number;
  total: number;
  pageSize: number;
  onPage: (p: number) => void;
}) {
  const totalPages = Math.ceil(total / pageSize);
  if (totalPages <= 1) return null;

  return (
    <div className="mt-8 flex items-center justify-center gap-2">
      <button
        onClick={() => onPage(page - 1)}
        disabled={page === 1}
        className={cn(
          "flex h-9 w-9 items-center justify-center rounded-lg border text-sm transition-all",
          "border-white/10 bg-white/5 text-slate-400",
          "hover:border-white/20 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed"
        )}
        aria-label="Previous page"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      {Array.from({ length: totalPages }, (_, i) => i + 1)
        .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
        .reduce<(number | "...")[]>((acc, p, idx, arr) => {
          if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push("...");
          acc.push(p);
          return acc;
        }, [])
        .map((p, i) =>
          p === "..." ? (
            <span key={`ellipsis-${i}`} className="px-1 text-slate-500">
              …
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onPage(p as number)}
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-lg border text-sm font-medium transition-all",
                p === page
                  ? "border-indigo-500/50 bg-indigo-500/20 text-indigo-300"
                  : "border-white/10 bg-white/5 text-slate-400 hover:border-white/20 hover:text-white"
              )}
            >
              {p}
            </button>
          )
        )}

      <button
        onClick={() => onPage(page + 1)}
        disabled={page === totalPages}
        className={cn(
          "flex h-9 w-9 items-center justify-center rounded-lg border text-sm transition-all",
          "border-white/10 bg-white/5 text-slate-400",
          "hover:border-white/20 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed"
        )}
        aria-label="Next page"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}

// ------------------------------------------------------------------
// Main grid
// ------------------------------------------------------------------

interface ScholarshipGridProps {
  scholarships: ScholarshipSummary[];
  loading: boolean;
  total: number;
  page: number;
  pageSize: number;
  hasFilters: boolean;
  onPage: (p: number) => void;
  onSaveToggle?: (id: string, saved: boolean) => void;
}

export default function ScholarshipGrid({
  scholarships,
  loading,
  total,
  page,
  pageSize,
  hasFilters,
  onPage,
  onSaveToggle,
}: ScholarshipGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: pageSize }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  if (scholarships.length === 0) {
    return <EmptyState hasFilters={hasFilters} />;
  }

  return (
    <>
      {/* Result count */}
      <p className="mb-4 text-xs text-slate-400">
        Showing {Math.min((page - 1) * pageSize + 1, total)}–{Math.min(page * pageSize, total)} of{" "}
        <span className="text-white font-medium">{total}</span> scholarship
        {total !== 1 ? "s" : ""}
      </p>

      {/* Grid */}
      <motion.div
        variants={stagger}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3"
      >
        {scholarships.map((s, i) => (
          <ScholarshipCard
            key={s.id}
            scholarship={s}
            index={i}
            onSaveToggle={onSaveToggle}
          />
        ))}
      </motion.div>

      {/* Pagination */}
      <Pagination
        page={page}
        total={total}
        pageSize={pageSize}
        onPage={onPage}
      />
    </>
  );
}
