"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, User, Settings, LogOut, BarChart3 } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import GlobalSearch from "@/components/dashboard/GlobalSearch";
import NotificationsBell from "@/components/dashboard/NotificationsBell";
import { useLanguage } from "@/components/i18n/LanguageProvider";

interface TopNavProps {
  userName?: string;
  userEmail?: string;
}

const MENU = [
  { href: "/dashboard/settings?tab=profile", label: "Profile", icon: User },
  { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export default function TopNav({ userName = "Learner", userEmail = "" }: TopNavProps) {
  const router = useRouter();
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const { locale, setLocale, t } = useLanguage();

  useEffect(() => {
    function close(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    }

    function onEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setProfileOpen(false);
    }

    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", onEscape);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", onEscape);
    };
  }, []);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    toast.success(locale === "ur" ? "آپ سائن آؤٹ ہو گئے" : "Signed out");
    router.push("/");
    router.refresh();
  }

  function go(href: string) {
    setProfileOpen(false);
    router.push(href);
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-white/[0.07] bg-[#070b18]/80 px-4 backdrop-blur-2xl sm:px-6">
      <GlobalSearch />

      <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
        <NotificationsBell />
        <button type="button" onClick={() => setLocale(locale === "en" ? "ur" : "en")} className="rounded-lg border border-white/10 px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:bg-white/[0.06]" aria-label={t("language")}>
          {locale === "en" ? t("urdu") : t("english")}
        </button>

        {/* Profile */}
        <div className="relative" ref={profileRef}>
          <button
            type="button"
            onClick={() => setProfileOpen((v) => !v)}
            className="flex items-center gap-2 rounded-xl px-2 py-1.5 transition-colors hover:bg-white/[0.06]"
            aria-label={t("accountMenu")}
            aria-expanded={profileOpen}
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-xs font-semibold text-white">
              {userName.charAt(0).toUpperCase()}
            </span>
            <span className="hidden max-w-[100px] truncate text-sm font-medium text-slate-200 sm:block">
              {userName}
            </span>
            <ChevronDown className="hidden h-3.5 w-3.5 text-slate-500 sm:block" />
          </button>

          <AnimatePresence>
            {profileOpen && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 6, scale: 0.96 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-2xl border border-white/10 bg-[#0c1224] shadow-2xl"
              >
                <div className="border-b border-white/[0.07] px-4 py-3">
                  <p className="truncate text-sm font-medium text-white">{userName}</p>
                  <p className="truncate text-[12px] text-slate-500">{userEmail}</p>
                </div>
                <div className="p-1.5">
                  {MENU.map((item) => (
                    <button
                      key={item.href}
                      type="button"
                      onClick={() => go(item.href)}
                      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-slate-300 transition-colors hover:bg-white/[0.05] hover:text-white"
                    >
                      <item.icon className="h-4 w-4" /> {item.label === "Profile" ? t("profile") : item.label === "Analytics" ? t("analytics") : t("settings")}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-rose-400 transition-colors hover:bg-rose-500/10"
                  >
                    <LogOut className="h-4 w-4" /> {t("signOut")}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
