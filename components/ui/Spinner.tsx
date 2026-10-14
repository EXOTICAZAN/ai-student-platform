"use client";

import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function Spinner({ className }: { className?: string }) {
  return (
    <Loader2
      className={cn("h-5 w-5 animate-spin text-indigo-400", className)}
    />
  );
}

/** Full-panel loading placeholder used while a server component streams in. */
export function LoadingPanel({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.03] px-6 py-16">
      <Spinner className="h-6 w-6" />
      <p className="mt-3 text-[13px] text-slate-500">{label}</p>
    </div>
  );
}

/** Animated skeleton rows for list views. */
export function SkeletonList({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="h-20 animate-pulse rounded-2xl border border-white/[0.06] bg-white/[0.03]"
          style={{ animationDelay: `${i * 90}ms` }}
        />
      ))}
    </div>
  );
}

export default Spinner;
