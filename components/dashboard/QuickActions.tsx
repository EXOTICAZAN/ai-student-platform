"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Brain, Layers, HelpCircle, Trophy, NotebookPen, Calendar } from "lucide-react";
import { ease } from "@/lib/motion";
import { useLanguage } from "@/components/i18n/LanguageProvider";

const actions = [
  { href: "/dashboard/tutor", label: "AI Tutor", desc: "Ask anything", icon: Brain, gradient: "from-indigo-500 to-blue-500" },
  { href: "/dashboard/flashcards", label: "Flashcards", desc: "Review cards", icon: Layers, gradient: "from-purple-500 to-pink-500" },
  { href: "/dashboard/quiz", label: "Quiz", desc: "Test yourself", icon: HelpCircle, gradient: "from-emerald-500 to-teal-500" },
  { href: "/dashboard/scholarships", label: "Scholarships", desc: "Find funding", icon: Trophy, gradient: "from-amber-500 to-orange-500" },
  { href: "/dashboard/notes", label: "AI Notes", desc: "Summarize", icon: NotebookPen, gradient: "from-sky-500 to-cyan-500" },
  { href: "/dashboard/planner", label: "Planner", desc: "Schedule", icon: Calendar, gradient: "from-rose-500 to-red-500" },
];

export default function QuickActions() {
  const { t } = useLanguage();
  const labels = ["tutor", "flashcards", "quiz", "scholarships", "notes", "planner"] as const;
  const descriptions = ["askAnything", "reviewCards", "testYourself", "findFunding", "summarize", "schedule"] as const;
  return (
    <div>
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-400">
        {t("quickActions")}
      </h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {actions.map((action, i) => (
          <motion.div
            key={action.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 + i * 0.04, ease }}
          >
            <Link
              href={action.href}
              className="group flex items-center gap-3.5 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4 transition-all duration-300 hover:border-white/15 hover:bg-white/[0.06] hover:shadow-[0_8px_30px_rgba(0,0,0,0.2)]"
            >
              <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${action.gradient} shadow-lg transition-transform duration-300 group-hover:scale-110`}>
                <action.icon className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">{t(labels[i])}</p>
                <p className="text-[12px] text-slate-500">{t(descriptions[i])}</p>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
