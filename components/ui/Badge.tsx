"use client";

import { cn } from "@/lib/utils";

// =============================================================
// Small display primitives shared across the dashboard features.
// =============================================================

type Tone =
  | "neutral"
  | "indigo"
  | "purple"
  | "emerald"
  | "amber"
  | "rose"
  | "sky";

const tones: Record<Tone, string> = {
  neutral: "border-white/10 bg-white/5 text-slate-300",
  indigo: "border-indigo-500/30 bg-indigo-500/10 text-indigo-300",
  purple: "border-purple-500/30 bg-purple-500/10 text-purple-300",
  emerald: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  amber: "border-amber-500/30 bg-amber-500/10 text-amber-300",
  rose: "border-rose-500/30 bg-rose-500/10 text-rose-300",
  sky: "border-sky-500/30 bg-sky-500/10 text-sky-300",
};

export function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: React.ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5",
        "text-[11px] font-medium whitespace-nowrap",
        tones[tone],
        className
      )}
    >
      {children}
    </span>
  );
}

export function Card({
  children,
  className,
  as: As = "div",
}: {
  children: React.ReactNode;
  className?: string;
  as?: React.ElementType;
}) {
  return (
    <As
      className={cn(
        "rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5",
        className
      )}
    >
      {children}
    </As>
  );
}

export function CardTitle({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <h2
      className={cn(
        "mb-4 text-sm font-semibold uppercase tracking-wider text-slate-400",
        className
      )}
    >
      {children}
    </h2>
  );
}

/** Formats an ISO timestamp as "14 min ago" / "Yesterday" / "3 Mar". */
export function relativeTime(iso: string | null | undefined): string {
  if (!iso) return "";

  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";

  const diff = Date.now() - then;
  const minute = 60_000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diff < minute) return "just now";
  if (diff < hour) return `${Math.floor(diff / minute)} min ago`;
  if (diff < day) return `${Math.floor(diff / hour)}h ago`;
  if (diff < 2 * day) return "Yesterday";
  if (diff < 7 * day) return `${Math.floor(diff / day)} days ago`;

  return new Date(iso).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
  });
}
