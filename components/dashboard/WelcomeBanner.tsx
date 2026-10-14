"use client";

import { motion } from "framer-motion";
import { ease } from "@/lib/motion";
import { useLanguage } from "@/components/i18n/LanguageProvider";

interface WelcomeBannerProps {
  name: string;
  email?: string;
  country?: string | null;
  grade?: string | null;
  learningGoal?: string | null;
}

export default function WelcomeBanner({
  name,
  email,
  country,
  grade,
  learningGoal,
}: WelcomeBannerProps) {
  const { t } = useLanguage();
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? t("goodMorning") : hour < 18 ? t("goodAfternoon") : t("goodEvening");

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease }}
      className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-br from-indigo-600/20 via-purple-600/10 to-transparent p-6 sm:p-8"
    >
      <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-indigo-500/20 blur-[60px]" />
      <div className="relative">
        <p className="text-sm font-medium text-indigo-300">{greeting}</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-white sm:text-3xl">
          {t("welcomeBack")}, {name}
        </h1>
        <div className="mt-4 space-y-1 text-sm text-slate-300">
  <p>📧 {email}</p>

  {country && <p>🌍 {t("country")}: {country}</p>}

  {grade && <p>🎓 {t("grade")}: {grade}</p>}

  {learningGoal && <p>🎯 {t("goal")}: {learningGoal}</p>}
</div>
      </div>
    </motion.div>
  );
}
