"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Palette,
  Settings,
  ShieldAlert,
  User,
} from "lucide-react";
import DashboardShell from "@/components/dashboard/DashboardShell";
import PageHeader from "@/components/ui/PageHeader";
import ProfileSection from "./ProfileSection";
import PreferencesSection from "./PreferencesSection";
import AccountSection from "./AccountSection";
import { fadeUp, stagger } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/components/i18n/LanguageProvider";

export interface ProfileData {
  full_name: string;
  country: string;
  grade: string;
  learning_goal: string;
  target_degree: string;
  preferred_language: string;
}

export interface SettingsData {
  daily_goal_minutes: number;
}

export type TabId = "profile" | "preferences" | "account";

export const TAB_IDS: TabId[] = [
  "profile",
  "preferences",
  "account",
];

interface Props {
  userId: string;
  email: string;
  userName: string;
  memberSince: string;
  projectRef: string;
  profile: ProfileData;
  settings: SettingsData;
  initialTab?: TabId;
}

const TABS: { id: TabId; label: string; icon: typeof User }[] = [
  { id: "profile", label: "Profile", icon: User },
  { id: "preferences", label: "Preferences", icon: Palette },
  { id: "account", label: "Account", icon: ShieldAlert },
];

export default function SettingsClient({
  userId,
  email,
  userName,
  memberSince,
  projectRef,
  profile,
  settings,
  initialTab = "profile",
}: Props) {
  const { t } = useLanguage();
  const [tab, setTab] = useState<TabId>(initialTab);
  const [profileDirty, setProfileDirty] = useState(false);
  const [prefsDirty, setPrefsDirty] = useState(false);

  const anyDirty = profileDirty || prefsDirty;

  useEffect(() => {
    if (!anyDirty) return;

    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };

    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [anyDirty]);

  const onProfileDirty = useCallback((dirty: boolean) => setProfileDirty(dirty), []);
  const onPrefsDirty = useCallback((dirty: boolean) => setPrefsDirty(dirty), []);

  return (
    <DashboardShell userName={userName} userEmail={email}>
      <div className="mx-auto max-w-4xl space-y-6">
        <PageHeader
          icon={Settings}
          title={t("settings")}
          subtitle={t("settingsSubtitle")}
        />

        <motion.div
          variants={stagger}
          initial="hidden"
          animate="show"
          className="flex flex-wrap gap-1.5"
        >
          <motion.div variants={fadeUp} className="flex flex-wrap gap-1.5">
            {TABS.map(({ id, icon: Icon }) => {
              const dirty =
                (id === "profile" && profileDirty) ||
                (id === "preferences" && prefsDirty);

              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setTab(id)}
                  className={cn(
                    "relative inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-[13px] font-medium transition-all",
                    tab === id
                      ? "border-indigo-500/50 bg-indigo-500/15 text-indigo-200"
                      : "border-white/10 bg-white/[0.03] text-slate-400 hover:border-white/20 hover:text-white"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {id === "profile" ? t("profile") : id === "preferences" ? t("preferences") : t("account")}
                  {dirty && (
                    <span
                      title="Unsaved changes"
                      className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-amber-400"
                    />
                  )}
                </button>
              );
            })}
          </motion.div>
        </motion.div>

        {/* All sections stay mounted so draft edits survive tab switches. */}
        <div className={tab === "profile" ? undefined : "hidden"}>
          <ProfileSection profile={profile} email={email} onDirtyChange={onProfileDirty} />
        </div>
        <div className={tab === "preferences" ? undefined : "hidden"}>
          <PreferencesSection settings={settings} onDirtyChange={onPrefsDirty} />
        </div>
        <div className={tab === "account" ? undefined : "hidden"}>
          <AccountSection
            userId={userId}
            email={email}
            memberSince={memberSince}
            projectRef={projectRef}
          />
        </div>
      </div>
    </DashboardShell>
  );
}
