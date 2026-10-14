"use client";

import { motion } from "framer-motion";
import { Flame, Zap, Trophy, Cpu } from "lucide-react";
import { ease } from "@/lib/motion";
import type { DashboardStats } from "@/lib/study/types";
import { useLanguage } from "@/components/i18n/LanguageProvider";

const LEVEL_TITLES = [
  "Novice",
  "Apprentice",
  "Scholar",
  "Adept",
  "Expert",
  "Master",
  "Sage",
];

function levelTitle(level: number) {
  return LEVEL_TITLES[Math.min(level - 1, LEVEL_TITLES.length - 1)] ?? "Scholar";
}

interface StatCardsProps {
  stats: DashboardStats;
}

export default function StatCards({ stats }: StatCardsProps) {
  const { t } = useLanguage();
  const cards = [
    {
      label: t("studyStreak"),
      value: String(stats.streak_days),
      unit: stats.streak_days === 1 ? t("day") : t("days"),
      icon: Flame,
      color: "from-orange-500 to-amber-500",
      glow: "shadow-orange-500/20",
    },
    {
      label: t("xp"),
      value: stats.total_xp.toLocaleString(),
      unit: t("points"),
      icon: Zap,
      color: "from-indigo-500 to-blue-500",
      glow: "shadow-indigo-500/20",
    },
    {
      label: t("level"),
      value: String(stats.level),
      unit: levelTitle(stats.level),
      icon: Trophy,
      color: "from-purple-500 to-pink-500",
      glow: "shadow-purple-500/20",
    },
    {
      label: t("aiUsage"),
      value: String(stats.ai_usage),
      unit: t("queries"),
      icon: Cpu,
      color: "from-emerald-500 to-teal-500",
      glow: "shadow-emerald-500/20",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((stat, i) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: i * 0.06, ease }}
          className={`group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5 transition-all duration-300 hover:border-white/15 hover:bg-white/[0.05] ${stat.glow}`}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[12px] font-medium text-slate-400">{stat.label}</p>
              <p className="mt-1 text-2xl font-bold tracking-tight text-white">
                {stat.value}
                <span className="ml-1.5 text-sm font-medium text-slate-500">{stat.unit}</span>
              </p>
            </div>
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${stat.color} shadow-lg transition-transform duration-300 group-hover:scale-110`}>
              <stat.icon className="h-5 w-5 text-white" />
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
