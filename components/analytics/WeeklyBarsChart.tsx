"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardTitle } from "@/components/ui/Badge";
import { ease } from "@/lib/motion";
import { cn } from "@/lib/utils";
import type { WeeklyMinutes } from "@/lib/study/types";

interface Props {
  weekly: WeeklyMinutes[];
  goalMinutes: number;
  minutesThisWeek: number;
  minutesLastWeek: number;
}

export default function WeeklyBarsChart({
  weekly,
  goalMinutes,
  minutesThisWeek,
  minutesLastWeek,
}: Props) {
  const [hover, setHover] = useState<number | null>(null);

  const hasData = minutesThisWeek > 0 || minutesLastWeek > 0;
  const scale =
    Math.max(goalMinutes, ...weekly.map((d) => d.minutes), 1) * 1.15;
  const goalPct = Math.min(100, (goalMinutes / scale) * 100);
  const delta =
    minutesLastWeek > 0
      ? Math.round(((minutesThisWeek - minutesLastWeek) / minutesLastWeek) * 100)
      : null;

  return (
    <Card>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <CardTitle className="mb-0">Study time this week</CardTitle>
        <span className="inline-flex items-center gap-1.5 text-[12px] text-slate-400">
          <span className="h-0 w-5 border-t border-dashed border-amber-400/70" />
          Daily goal · {goalMinutes} min
        </span>
      </div>

      {hasData ? (
        <>
          <div className="relative h-44">
            <div
              className="absolute inset-x-0 z-10 border-t border-dashed border-amber-400/50"
              style={{ bottom: `${goalPct}%` }}
            />
            <div className="flex h-full items-end justify-between gap-2">
              {weekly.map((d, i) => {
                const pct = (d.minutes / scale) * 100;
                return (
                  <div
                    key={d.day_index}
                    className="group relative flex h-full flex-1 flex-col justify-end"
                    onMouseEnter={() => setHover(i)}
                    onMouseLeave={() => setHover(null)}
                  >
                    {hover === i && (
                      <div className="pointer-events-none absolute -top-1 left-1/2 z-20 -translate-x-1/2 whitespace-nowrap rounded-lg border border-white/10 bg-[#0c1224] px-2.5 py-1.5 text-[11px] text-slate-200 shadow-lg">
                        {d.minutes} min · {d.xp} XP · {d.events} events
                      </div>
                    )}
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${pct}%` }}
                      transition={{ duration: 0.7, delay: 0.15 + i * 0.06, ease }}
                      className={cn(
                        "mx-auto w-full max-w-[36px] rounded-t-lg bg-gradient-to-t from-indigo-600 to-purple-500",
                        d.minutes > 0
                          ? "opacity-80 group-hover:opacity-100"
                          : "opacity-0"
                      )}
                    />
                  </div>
                );
              })}
            </div>
          </div>
          <div className="mt-2 flex justify-between gap-2">
            {weekly.map((d) => (
              <span
                key={d.day_index}
                className="flex-1 text-center text-[11px] text-slate-500"
              >
                {d.day}
              </span>
            ))}
          </div>
        </>
      ) : (
        <p className="py-10 text-center text-[13px] leading-relaxed text-slate-500">
          No study minutes recorded this week or last week. Time is logged
          automatically when you review flashcards or complete tasks.
        </p>
      )}

      {hasData && (
        <p className="mt-3 border-t border-white/[0.06] pt-3 text-[12px] text-slate-400">
          <span className="font-semibold text-white">{minutesThisWeek} min</span>{" "}
          this week
          {delta !== null ? (
            <>
              {" · "}
              <span
                className={delta >= 0 ? "text-emerald-400" : "text-rose-400"}
              >
                {delta >= 0 ? `+${delta}%` : `${delta}%`}
              </span>{" "}
              vs last week ({minutesLastWeek} min)
            </>
          ) : (
            minutesThisWeek > 0 && <> · no minutes recorded last week</>
          )}
        </p>
      )}
    </Card>
  );
}
