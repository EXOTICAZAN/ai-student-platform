"use client";

import { motion } from "framer-motion";
import { ease } from "@/lib/motion";
import type { WeeklyMinutes } from "@/lib/study/types";

const BAR_COLORS = [
  "from-indigo-500 to-blue-500",
  "from-purple-500 to-pink-500",
  "from-emerald-500 to-teal-500",
  "from-amber-500 to-orange-500",
  "from-sky-500 to-cyan-500",
];

export interface ProgressItem {
  name: string;
  progress: number;
  detail?: string;
}

interface ProgressChartsProps {
  weekly: WeeklyMinutes[];
  progress: ProgressItem[];
}

export default function ProgressCharts({ weekly, progress }: ProgressChartsProps) {
  const peak = Math.max(1, ...weekly.map((d) => d.minutes));
  const totalMinutes = weekly.reduce((sum, d) => sum + d.minutes, 0);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {/* Subject mastery */}
      <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-400">
          Subject mastery
        </h2>

        {progress.length === 0 ? (
          <p className="py-10 text-center text-[13px] leading-relaxed text-slate-500">
            No quiz attempts yet. Take a quiz and your average accuracy per
            subject will show up here.
          </p>
        ) : (
          <div className="space-y-4">
            {progress.map((c, i) => (
              <div key={c.name}>
                <div className="mb-1.5 flex justify-between gap-3 text-[13px]">
                  <span className="truncate text-slate-300">{c.name}</span>
                  <span className="shrink-0 text-slate-500">
                    {c.progress}%
                    {c.detail ? ` · ${c.detail}` : ""}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/10">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, Math.max(0, c.progress))}%` }}
                    transition={{ duration: 1, delay: 0.2 + i * 0.1, ease }}
                    className={`h-full rounded-full bg-gradient-to-r ${BAR_COLORS[i % BAR_COLORS.length]}`}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Weekly study time */}
      <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5">
        <div className="mb-4 flex items-baseline justify-between gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
            Study time this week
          </h2>
          <span className="shrink-0 text-[12px] text-slate-500">
            {totalMinutes} min total
          </span>
        </div>

        <div className="flex h-40 items-end justify-between gap-2">
          {weekly.map((d, i) => {
            const height = peak > 0 ? Math.round((d.minutes / peak) * 100) : 0;

            return (
              <div key={`${d.day_index}-${i}`} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
                <span className="text-[11px] text-slate-500">
                  {d.minutes > 0 ? `${d.minutes}m` : ""}
                </span>
                <motion.div
                  title={`${d.day}: ${d.minutes} min · ${d.xp} XP`}
                  initial={{ height: 0 }}
                  animate={{ height: `${Math.max(height, d.minutes > 0 ? 4 : 0)}%` }}
                  transition={{ duration: 0.7, delay: 0.15 + i * 0.06, ease }}
                  className={`w-full max-w-[36px] rounded-t-lg bg-gradient-to-t from-indigo-600 to-purple-500 ${d.minutes > 0 ? "opacity-80" : "opacity-20"}`}
                />
                <span className="text-[11px] text-slate-500">{d.day}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
