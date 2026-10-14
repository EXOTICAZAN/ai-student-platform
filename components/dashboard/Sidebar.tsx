"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Brain,
  NotebookPen,
  Layers,
  GraduationCap,
  HelpCircle,
  Trophy,
  Calendar,
  BarChart3,
  Settings,
  Sparkles,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/components/i18n/LanguageProvider";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/tutor", label: "AI Tutor", icon: Brain },
  { href: "/dashboard/notes", label: "AI Notes", icon: NotebookPen },
  { href: "/dashboard/flashcards", label: "Flashcards", icon: Layers },
  { href: "/dashboard/courses", label: "Courses", icon: GraduationCap },
  { href: "/dashboard/quiz", label: "Quiz Generator", icon: HelpCircle },
  { href: "/dashboard/scholarships", label: "Scholarships", icon: Trophy },
  { href: "/dashboard/planner", label: "Study Planner", icon: Calendar },
  { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const { t } = useLanguage();
  const labels = ["dashboard", "tutor", "notes", "flashcards", "courses", "quiz", "scholarships", "planner", "analytics", "settings"] as const;

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 hidden h-screen md:flex flex-col border-r border-white/[0.07] bg-[#070b18]/90 backdrop-blur-2xl transition-all duration-300",
        collapsed ? "w-[72px]" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center gap-2.5 border-b border-white/[0.07] px-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/30">
          <Sparkles className="h-4 w-4 text-white" />
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "auto" }}
              exit={{ opacity: 0, width: 0 }}
              className="overflow-hidden whitespace-nowrap text-base font-semibold text-white"
            >
              EduForge<span className="text-indigo-400">AI</span>
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {navItems.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                active
                  ? "bg-indigo-500/15 text-white shadow-[0_0_20px_rgba(99,102,241,0.15)]"
                  : "text-slate-400 hover:bg-white/[0.04] hover:text-white"
              )}
            >
              {active && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute left-0 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-r-full bg-indigo-400"
                />
              )}
              <item.icon
                className={cn(
                  "h-[18px] w-[18px] shrink-0 transition-colors",
                  active ? "text-indigo-400" : "text-slate-500 group-hover:text-slate-300"
                )}
              />
              <AnimatePresence>
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="truncate"
                  >
                    {t(labels[navItems.indexOf(item)])}
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>
          );
        })}
      </nav>

      {/* Collapse toggle */}
      <div className="border-t border-white/[0.07] p-3">
        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          className="flex w-full items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm text-slate-400 transition-colors hover:bg-white/[0.04] hover:text-white"
          aria-label={collapsed ? t("expandSidebar") : t("collapseSidebar")}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          {!collapsed && <span>{t("collapse")}</span>}
        </button>
      </div>
    </aside>
  );
}
