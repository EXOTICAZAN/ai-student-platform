"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  CheckCircle2,
  Flame,
  HelpCircle,
  Layers,
  Lightbulb,
  ListChecks,
  MessageSquare,
  NotebookPen,
  Sparkles,
  Target,
  Trophy,
  User,
  Zap,
} from "lucide-react";
import DashboardShell from "@/components/dashboard/DashboardShell";
import PageHeader from "@/components/ui/PageHeader";
import { Badge, Card, CardTitle, relativeTime } from "@/components/ui/Badge";
import WeeklyBarsChart from "./WeeklyBarsChart";
import XpAreaChart from "./XpAreaChart";
import type { XpPoint } from "./XpAreaChart";
import type { AnalyticsData, RangeDays } from "./types";
import { ease, fadeUp, stagger } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { ACTIVITY_META } from "@/lib/study/types";
import type { ActivityType } from "@/lib/study/types";

interface Props {
  data: AnalyticsData;
  userName: string;
  userEmail: string;
}

const XP_PER_LEVEL = 1000;
const DAY_MS = 86_400_000;
const RANGE_OPTIONS: { value: RangeDays; label: string }[] = [
  { value: 7, label: "7d" },
  { value: 30, label: "30d" },
  { value: 90, label: "90d" },
];

const TYPE_VISUAL: Record<ActivityType, { icon: LucideIcon; gradient: string }> =
  {
    note: { icon: NotebookPen, gradient: "from-emerald-500 to-teal-500" },
    flashcard: { icon: Layers, gradient: "from-purple-500 to-pink-500" },
    quiz: { icon: HelpCircle, gradient: "from-indigo-500 to-blue-500" },
    task: { icon: CheckCircle2, gradient: "from-teal-500 to-cyan-500" },
    tutor: { icon: MessageSquare, gradient: "from-blue-500 to-indigo-500" },
    scholarship: { icon: Trophy, gradient: "from-amber-500 to-orange-500" },
    profile: { icon: User, gradient: "from-rose-500 to-pink-500" },
  };

function dateKey(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

function shortDate(key: string): string {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(Date.UTC(y ?? 1970, (m ?? 1) - 1, d ?? 1)).toLocaleDateString(
    "en-US",
    { month: "short", day: "numeric", timeZone: "UTC" }
  );
}

function pct(part: number, whole: number): number {
  return whole > 0 ? Math.round((part / whole) * 100) : 0;
}

export default function AnalyticsClient({ data, userName, userEmail }: Props) {
  const [range, setRange] = useState<RangeDays>(30);

  // Captured once per mount so the charts don't re-bucket mid-session.
  const [now] = useState(() => Date.now());
  const cutoffDate = dateKey(now - (range - 1) * DAY_MS);
  const cutoffIso = new Date(now - (range - 1) * DAY_MS).toISOString();

  const xpSeries = useMemo<XpPoint[]>(() => {
    const byDate = new Map(data.daily.map((d) => [d.date, d]));
    const points: XpPoint[] = [];
    let total = 0;
    for (let i = range - 1; i >= 0; i--) {
      const key = dateKey(now - i * DAY_MS);
      const xp = byDate.get(key)?.xp ?? 0;
      total += xp;
      points.push({ label: shortDate(key), xp, total });
    }
    return points;
  }, [data.daily, range, now]);

  const xpInRange = xpSeries[xpSeries.length - 1]?.total ?? 0;
  const eventsInRange = useMemo(
    () =>
      data.daily
        .filter((d) => d.date >= cutoffDate)
        .reduce((s, d) => s + d.events, 0),
    [data.daily, cutoffDate]
  );

  const typeTotals = useMemo(() => {
    const totals = new Map<ActivityType, number>();
    for (const d of data.daily) {
      if (d.date < cutoffDate) continue;
      for (const [t, n] of Object.entries(d.types)) {
        const type = t as ActivityType;
        totals.set(type, (totals.get(type) ?? 0) + (n ?? 0));
      }
    }
    return Array.from(totals.entries()).sort((a, b) => b[1] - a[1]);
  }, [data.daily, cutoffDate]);

  const subjectRows = useMemo(() => {
    const map = new Map<string, { attempts: number; score: number; total: number }>();
    for (const a of data.attempts) {
      if (a.completed_at < cutoffIso) continue;
      const key = a.subject?.trim() || "General";
      const entry = map.get(key) ?? { attempts: 0, score: 0, total: 0 };
      entry.attempts += 1;
      entry.score += a.score;
      entry.total += a.total;
      map.set(key, entry);
    }
    return Array.from(map.entries())
      .map(([subject, v]) => ({
        subject,
        attempts: v.attempts,
        accuracy: pct(v.score, v.total),
      }))
      .sort((a, b) => b.attempts - a.attempts || b.accuracy - a.accuracy)
      .slice(0, 6);
  }, [data.attempts, cutoffIso]);

  const taskStats = useMemo(() => {
    let done = 0;
    let doneMinutes = 0;
    let open = 0;
    let plannedMinutes = 0;
    const recent: { title: string; subject: string | null; completed_at: string }[] = [];

    for (const t of data.tasks) {
      if (t.status === "done") {
        if (t.completed_at && t.completed_at >= cutoffIso) {
          done += 1;
          doneMinutes += t.duration_minutes;
          recent.push({
            title: t.title,
            subject: t.subject,
            completed_at: t.completed_at,
          });
        }
      } else {
        open += 1;
        const anchor = t.due_at ?? t.created_at;
        if (anchor >= cutoffIso) plannedMinutes += t.duration_minutes;
      }
    }

    recent.sort((a, b) => b.completed_at.localeCompare(a.completed_at));
    return {
      done,
      open,
      doneMinutes,
      plannedMinutes,
      rate: pct(done, done + open),
      recent: recent.slice(0, 5),
    };
  }, [data.tasks, cutoffIso]);

  const insights = useMemo(() => {
    const out: string[] = [];
    const { stats, weekly, minutesLastWeek, flashcards } = data;
    const thisWeek = weekly.reduce((s, d) => s + d.minutes, 0);

    const bySubject = new Map<string, { n: number; score: number; total: number }>();
    for (const a of data.attempts) {
      const key = a.subject?.trim() || "General";
      const entry = bySubject.get(key) ?? { n: 0, score: 0, total: 0 };
      entry.n += 1;
      entry.score += a.score;
      entry.total += a.total;
      bySubject.set(key, entry);
    }
    let best: { subject: string; accuracy: number } | null = null;
    for (const [subject, v] of bySubject) {
      if (v.n < 2 || v.total === 0) continue;
      const acc = (v.score / v.total) * 100;
      if (!best || acc > best.accuracy) best = { subject, accuracy: acc };
    }
    if (best) {
      out.push(
        `Your accuracy is highest in ${best.subject} — ${Math.round(best.accuracy)}% across ${bySubject.get(best.subject)?.n ?? 0} attempts.`
      );
    }

    if (stats.streak_days >= 2) {
      out.push(
        `You've logged activity ${stats.streak_days} days in a row — keep the streak alive.`
      );
    } else if (stats.streak_days === 1) {
      out.push("You studied today — come back tomorrow to start a streak.");
    }

    if (minutesLastWeek > 0) {
      const delta = Math.round(((thisWeek - minutesLastWeek) / minutesLastWeek) * 100);
      out.push(
        delta >= 0
          ? `Study time is up ${delta}% this week vs last (${thisWeek} vs ${minutesLastWeek} min).`
          : `Study time dropped ${Math.abs(delta)}% this week vs last (${thisWeek} vs ${minutesLastWeek} min).`
      );
    } else if (thisWeek > 0) {
      out.push(`You logged ${thisWeek} minutes this week — last week has none recorded.`);
    }

    const weekAgo = new Date(now - 7 * DAY_MS).toISOString();
    const twoWeeksAgo = new Date(now - 14 * DAY_MS).toISOString();
    let curScore = 0;
    let curTotal = 0;
    let prevScore = 0;
    let prevTotal = 0;
    for (const a of data.attempts) {
      if (a.completed_at >= weekAgo) {
        curScore += a.score;
        curTotal += a.total;
      } else if (a.completed_at >= twoWeeksAgo) {
        prevScore += a.score;
        prevTotal += a.total;
      }
    }
    if (curTotal > 0 && prevTotal > 0) {
      const diff = Math.round(pct(curScore, curTotal) - pct(prevScore, prevTotal));
      if (diff > 0) {
        out.push(`Quiz accuracy improved ${diff} pts this week vs last (${pct(curScore, curTotal)}% vs ${pct(prevScore, prevTotal)}%).`);
      } else if (diff < 0) {
        out.push(`Quiz accuracy dropped ${Math.abs(diff)} pts this week vs last (${pct(curScore, curTotal)}% vs ${pct(prevScore, prevTotal)}%).`);
      }
    }

    if (flashcards.reviews > 0) {
      const retention = Math.round(
        (1 - flashcards.lapses / Math.max(1, flashcards.reviews)) * 100
      );
      out.push(
        `Flashcard retention is ${retention}% over ${flashcards.reviews.toLocaleString("en-US")} reviews.`
      );
    }

    const busiest = weekly.reduce((a, b) => (b.minutes > a.minutes ? b : a));
    if (busiest.minutes > 0) {
      out.push(`${busiest.day} was your strongest day this week with ${busiest.minutes} minutes.`);
    }

    if (out.length === 0 && stats.quizzes_taken > 0 && stats.avg_accuracy > 0) {
      out.push(
        `Across ${stats.quizzes_taken} quiz attempts your average accuracy is ${Math.round(stats.avg_accuracy)}%.`
      );
    }

    return out.slice(0, 5);
  }, [data, now]);

  const { stats, flashcards } = data;
  const levelXp = stats.total_xp % XP_PER_LEVEL;
  const retention =
    flashcards.reviews > 0
      ? Math.round((1 - flashcards.lapses / Math.max(1, flashcards.reviews)) * 100)
      : null;
  const minutesScale = Math.max(taskStats.plannedMinutes, taskStats.doneMinutes, 1);
  const maxTypeCount = typeTotals[0]?.[1] ?? 0;
  const maxBucket = Math.max(...flashcards.buckets.map((b) => b.count), 1);

  return (
    <DashboardShell userName={userName} userEmail={userEmail}>
      <div className="mx-auto max-w-7xl space-y-6">
        <PageHeader
          icon={BarChart3}
          title="Analytics"
          subtitle="Your real study numbers — XP, time, accuracy and retention."
          actions={
            <div className="flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.03] p-1">
              {RANGE_OPTIONS.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => setRange(o.value)}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-[12px] font-medium transition-all",
                    range === o.value
                      ? "bg-gradient-to-r from-indigo-600 to-purple-500 text-white shadow-lg shadow-indigo-500/20"
                      : "text-slate-400 hover:text-white"
                  )}
                >
                  {o.label}
                </button>
              ))}
            </div>
          }
        />

        <motion.div
          variants={stagger}
          initial="hidden"
          animate="show"
          className="space-y-6"
        >
          {/* Headline stats */}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <HeadlineStat
              label="Total XP"
              value={stats.total_xp.toLocaleString("en-US")}
              unit="pts"
              icon={Zap}
              color="from-indigo-500 to-blue-500"
              glow="shadow-indigo-500/20"
            />
            <HeadlineStat
              label="Current level"
              value={String(stats.level)}
              unit={`+${xpInRange.toLocaleString("en-US")} XP in ${range}d`}
              icon={Trophy}
              color="from-purple-500 to-pink-500"
              glow="shadow-purple-500/20"
            >
              <div className="mt-3">
                <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(levelXp / XP_PER_LEVEL) * 100}%` }}
                    transition={{ duration: 0.9, delay: 0.3, ease }}
                    className="h-full rounded-full bg-gradient-to-r from-purple-500 to-pink-500"
                  />
                </div>
                <p className="mt-1.5 text-[11px] text-slate-500">
                  {levelXp.toLocaleString("en-US")} / {XP_PER_LEVEL.toLocaleString("en-US")} XP
                  to level {stats.level + 1}
                </p>
              </div>
            </HeadlineStat>
            <HeadlineStat
              label="Study streak"
              value={String(stats.streak_days)}
              unit={stats.streak_days === 1 ? "day" : "days"}
              icon={Flame}
              color="from-orange-500 to-amber-500"
              glow="shadow-orange-500/20"
            />
            <HeadlineStat
              label="Avg quiz accuracy"
              value={stats.quizzes_taken > 0 ? `${Math.round(stats.avg_accuracy)}` : "—"}
              unit={stats.quizzes_taken > 0 ? "%" : undefined}
              icon={Target}
              color="from-emerald-500 to-teal-500"
              glow="shadow-emerald-500/20"
            >
              <p className="mt-3 text-[11px] text-slate-500">
                {stats.quizzes_taken > 0
                  ? `Across ${stats.quizzes_taken} quiz ${stats.quizzes_taken === 1 ? "attempt" : "attempts"}`
                  : "Take a quiz to start tracking accuracy"}
              </p>
            </HeadlineStat>
          </div>

          {/* Weekly study time */}
          <motion.div variants={fadeUp}>
            <WeeklyBarsChart
              weekly={data.weekly}
              goalMinutes={data.dailyGoalMinutes}
              minutesThisWeek={stats.minutes_this_week}
              minutesLastWeek={data.minutesLastWeek}
            />
          </motion.div>

          {/* XP over time */}
          <motion.div variants={fadeUp}>
            <Card>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <CardTitle className="mb-0">XP over time</CardTitle>
                <span className="text-[12px] text-slate-400">
                  Last {range} days ·{" "}
                  <span className="font-semibold text-indigo-300">
                    +{xpInRange.toLocaleString("en-US")} XP
                  </span>
                </span>
              </div>
              {xpInRange > 0 ? (
                <XpAreaChart points={xpSeries} />
              ) : (
                <SectionEmpty
                  icon={Zap}
                  message={`No XP earned in the last ${range} days.`}
                  href="/dashboard/notes"
                  linkLabel="Generate a note to earn XP"
                />
              )}
            </Card>
          </motion.div>

          <div className="grid gap-4 lg:grid-cols-2">
            {/* Activity breakdown */}
            <motion.div variants={fadeUp}>
              <Card className="h-full">
                <div className="mb-4 flex items-center justify-between gap-2">
                  <CardTitle className="mb-0">Activity breakdown</CardTitle>
                  <span className="text-[12px] text-slate-500">
                    {eventsInRange.toLocaleString("en-US")} events · {range}d
                  </span>
                </div>
                {typeTotals.length > 0 ? (
                  <div className="space-y-3.5">
                    {typeTotals.map(([type, count], i) => {
                      const visual = TYPE_VISUAL[type];
                      const meta = ACTIVITY_META[type];
                      return (
                        <div key={type}>
                          <div className="mb-1.5 flex items-center justify-between gap-2 text-[13px]">
                            <span className="inline-flex items-center gap-2 text-slate-300">
                              <span
                                className={cn(
                                  "flex h-6 w-6 items-center justify-center rounded-lg",
                                  meta.className
                                )}
                              >
                                <visual.icon className="h-3.5 w-3.5" />
                              </span>
                              {meta.label}
                            </span>
                            <span className="text-slate-500">
                              {count.toLocaleString("en-US")}
                            </span>
                          </div>
                          <div className="h-2 overflow-hidden rounded-full bg-white/10">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${(count / maxTypeCount) * 100}%` }}
                              transition={{ duration: 0.8, delay: 0.1 + i * 0.07, ease }}
                              className={cn(
                                "h-full rounded-full bg-gradient-to-r",
                                visual.gradient
                              )}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <SectionEmpty
                    icon={BarChart3}
                    message={`No activity recorded in the last ${range} days.`}
                    href="/dashboard/tutor"
                    linkLabel="Ask the AI Tutor"
                  />
                )}
              </Card>
            </motion.div>

            {/* Subject performance */}
            <motion.div variants={fadeUp}>
              <Card className="h-full">
                <div className="mb-4 flex items-center justify-between gap-2">
                  <CardTitle className="mb-0">Subject performance</CardTitle>
                  <span className="text-[12px] text-slate-500">Quizzes · {range}d</span>
                </div>
                {subjectRows.length > 0 ? (
                  <div className="space-y-4">
                    {subjectRows.map((s, i) => (
                      <div key={s.subject}>
                        <div className="mb-1.5 flex items-center justify-between gap-2 text-[13px]">
                          <span className="truncate text-slate-300">{s.subject}</span>
                          <span className="shrink-0 text-slate-500">
                            {s.attempts} {s.attempts === 1 ? "attempt" : "attempts"} ·{" "}
                            <span className="text-indigo-300">{s.accuracy}%</span>
                          </span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-white/10">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${s.accuracy}%` }}
                            transition={{ duration: 0.9, delay: 0.1 + i * 0.08, ease }}
                            className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-blue-500"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <SectionEmpty
                    icon={HelpCircle}
                    message={`No quiz attempts in the last ${range} days.`}
                    href="/dashboard/quiz"
                    linkLabel="Generate a quiz"
                  />
                )}
              </Card>
            </motion.div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            {/* Flashcard mastery */}
            <motion.div variants={fadeUp}>
              <Card className="h-full">
                <CardTitle>Flashcard mastery</CardTitle>
                {flashcards.total > 0 ? (
                  <div className="space-y-5">
                    <div className="grid grid-cols-4 gap-3">
                      <MiniStat label="Cards" value={flashcards.total} />
                      <MiniStat
                        label="Due now"
                        value={flashcards.due}
                        tone={flashcards.due > 0 ? "amber" : "default"}
                      />
                      <MiniStat label="Reviews" value={flashcards.reviews} />
                      <MiniStat label="Lapses" value={flashcards.lapses} />
                    </div>

                    <div>
                      <div className="mb-1.5 flex justify-between text-[13px]">
                        <span className="text-slate-300">Estimated retention</span>
                        <span className="text-slate-500">
                          {retention !== null ? `${retention}%` : "No reviews yet"}
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-white/10">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${retention ?? 0}%` }}
                          transition={{ duration: 0.9, delay: 0.2, ease }}
                          className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500"
                        />
                      </div>
                    </div>

                    <div>
                      <p className="mb-2 text-[12px] text-slate-500">
                        Cards by review interval (days)
                      </p>
                      <div className="flex h-24 items-end justify-between gap-2">
                        {flashcards.buckets.map((b, i) => (
                          <div
                            key={b.label}
                            className="group flex h-full flex-1 flex-col items-center justify-end gap-1.5"
                          >
                            <span className="text-[10px] text-slate-500 opacity-0 transition-opacity group-hover:opacity-100">
                              {b.count}
                            </span>
                            <motion.div
                              initial={{ height: 0 }}
                              animate={{
                                height: `${Math.max((b.count / maxBucket) * 100, b.count > 0 ? 4 : 0)}%`,
                              }}
                              transition={{ duration: 0.7, delay: 0.15 + i * 0.06, ease }}
                              className="w-full max-w-[32px] rounded-t-md bg-gradient-to-t from-indigo-600 to-purple-500 opacity-80"
                            />
                            <span className="text-[10px] text-slate-500">{b.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <SectionEmpty
                    icon={Layers}
                    message="No flashcards yet — retention and intervals appear once you create a deck."
                    href="/dashboard/flashcards"
                    linkLabel="Create a deck"
                  />
                )}
              </Card>
            </motion.div>

            {/* Task completion */}
            <motion.div variants={fadeUp}>
              <Card className="h-full">
                <div className="mb-4 flex items-center justify-between gap-2">
                  <CardTitle className="mb-0">Task completion</CardTitle>
                  <span className="text-[12px] text-slate-500">Last {range}d</span>
                </div>
                {data.tasks.length > 0 ? (
                  <div className="space-y-5">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone="emerald">
                        <CheckCircle2 className="h-3 w-3" />
                        {taskStats.done} done
                      </Badge>
                      <Badge tone="amber">{taskStats.open} still open</Badge>
                      <Badge tone="indigo">{taskStats.rate}% completion</Badge>
                    </div>

                    <div className="h-2 overflow-hidden rounded-full bg-white/10">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${taskStats.rate}%` }}
                        transition={{ duration: 0.9, delay: 0.15, ease }}
                        className="h-full rounded-full bg-gradient-to-r from-indigo-600 to-purple-500"
                      />
                    </div>

                    <div className="space-y-3">
                      <MinutesBar
                        label="Planned minutes"
                        value={taskStats.plannedMinutes}
                        scale={minutesScale}
                        gradient="from-amber-500 to-orange-500"
                        delay={0.2}
                      />
                      <MinutesBar
                        label="Completed minutes"
                        value={taskStats.doneMinutes}
                        scale={minutesScale}
                        gradient="from-emerald-500 to-teal-500"
                        delay={0.3}
                      />
                    </div>

                    <div>
                      <p className="mb-2 text-[12px] text-slate-500">Recently completed</p>
                      {taskStats.recent.length > 0 ? (
                        <ul className="space-y-2">
                          {taskStats.recent.map((t) => (
                            <li
                              key={`${t.title}-${t.completed_at}`}
                              className="flex items-center justify-between gap-2 rounded-lg bg-white/[0.03] px-3 py-2"
                            >
                              <span className="flex min-w-0 items-center gap-2">
                                <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
                                <span className="truncate text-[13px] text-slate-300">
                                  {t.title}
                                </span>
                                {t.subject && <Badge tone="purple">{t.subject}</Badge>}
                              </span>
                              <span className="shrink-0 text-[11px] text-slate-500">
                                {relativeTime(t.completed_at)}
                              </span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-[12px] text-slate-500">
                          Nothing completed in this range yet.
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <SectionEmpty
                    icon={ListChecks}
                    message="No tasks yet — plan your study sessions to track completion here."
                    href="/dashboard/planner"
                    linkLabel="Open the planner"
                  />
                )}
              </Card>
            </motion.div>
          </div>

          {/* Insights */}
          <motion.div variants={fadeUp}>
            <Card>
              <div className="mb-4 flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-amber-300" />
                <CardTitle className="mb-0">Personal bests &amp; insights</CardTitle>
              </div>
              {insights.length > 0 ? (
                <ul className="space-y-2.5">
                  {insights.map((text) => (
                    <li key={text} className="flex items-start gap-2.5 text-[13px] leading-relaxed text-slate-300">
                      <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-indigo-400" />
                      {text}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-[13px] leading-relaxed text-slate-500">
                  Not enough activity yet to draw honest conclusions. Take a quiz,
                  review some flashcards or log study time, and real insights will
                  appear here — nothing is fabricated.
                </p>
              )}
            </Card>
          </motion.div>
        </motion.div>
      </div>
    </DashboardShell>
  );
}

function HeadlineStat({
  label,
  value,
  unit,
  icon: Icon,
  color,
  glow,
  children,
}: {
  label: string;
  value: string;
  unit?: string;
  icon: LucideIcon;
  color: string;
  glow: string;
  children?: React.ReactNode;
}) {
  return (
    <motion.div
      variants={fadeUp}
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-white/[0.08]",
        "bg-white/[0.03] p-5 transition-all duration-300",
        "hover:border-white/15 hover:bg-white/[0.05]",
        glow
      )}
    >
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="text-[12px] font-medium text-slate-400">{label}</p>
          <p className="mt-1 text-2xl font-bold tracking-tight text-white">
            {value}
            {unit && (
              <span className="ml-1.5 text-sm font-medium text-slate-500">{unit}</span>
            )}
          </p>
        </div>
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
            "bg-gradient-to-br shadow-lg transition-transform duration-300 group-hover:scale-110",
            color
          )}
        >
          <Icon className="h-5 w-5 text-white" />
        </div>
      </div>
      {children}
    </motion.div>
  );
}

function MiniStat({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: number;
  tone?: "default" | "amber";
}) {
  return (
    <div className="rounded-xl bg-white/[0.03] px-3 py-2.5 text-center">
      <p
        className={cn(
          "text-lg font-bold tracking-tight",
          tone === "amber" && value > 0 ? "text-amber-300" : "text-white"
        )}
      >
        {value.toLocaleString("en-US")}
      </p>
      <p className="mt-0.5 text-[11px] text-slate-500">{label}</p>
    </div>
  );
}

function MinutesBar({
  label,
  value,
  scale,
  gradient,
  delay,
}: {
  label: string;
  value: number;
  scale: number;
  gradient: string;
  delay: number;
}) {
  return (
    <div>
      <div className="mb-1.5 flex justify-between text-[12px]">
        <span className="text-slate-400">{label}</span>
        <span className="text-slate-300">{value.toLocaleString("en-US")} min</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-white/10">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${(value / scale) * 100}%` }}
          transition={{ duration: 0.8, delay, ease }}
          className={cn("h-full rounded-full bg-gradient-to-r", gradient)}
        />
      </div>
    </div>
  );
}

function SectionEmpty({
  icon: Icon,
  message,
  href,
  linkLabel,
}: {
  icon: LucideIcon;
  message: string;
  href: string;
  linkLabel: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-white/10 px-4 py-10 text-center">
      <Icon className="h-5 w-5 text-slate-500" />
      <p className="max-w-xs text-[13px] leading-relaxed text-slate-500">{message}</p>
      <Link
        href={href}
        className="text-[12px] font-medium text-indigo-400 transition-colors hover:text-indigo-300"
      >
        {linkLabel} →
      </Link>
    </div>
  );
}
