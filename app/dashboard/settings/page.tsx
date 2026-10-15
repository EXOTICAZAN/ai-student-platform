import { redirect } from "next/navigation";
import { getAuthContext } from "@/lib/supabase/server";
import SettingsClient from "@/components/settings/SettingsClient";
import type { ProfileRow, UserSettingsRow } from "@/lib/study/types";
import {
  type ProfileData,
  type SettingsData,
  type TabId,
} from "@/components/settings/SettingsClient";

export const metadata = { title: "Settings — EduForge AI" };

const DEFAULT_SETTINGS: SettingsData = {
  daily_goal_minutes: 60,
};

// Keep server-side route validation independent from the client module. A
// runtime import of a value from a "use client" module becomes a client
// reference proxy during the server build and cannot be called with .includes.
const VALID_TAB_IDS: readonly TabId[] = ["profile", "preferences", "account"];

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { supabase, user } = await getAuthContext();

  if (!user) redirect("/login");

  const { tab } = await searchParams;
  const initialTab: TabId = VALID_TAB_IDS.includes(tab as TabId)
    ? (tab as TabId)
    : "profile";

  const [{ data: profileRow }, { data: settingsRow }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
    supabase
      .from("user_settings")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);

  const profile = profileRow as ProfileRow | null;
  const settings = settingsRow as UserSettingsRow | null;

  const meta = user.user_metadata as { full_name?: string };
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const projectRef =
    /https?:\/\/([^.]+)\./.exec(supabaseUrl)?.[1] ?? "unknown";

  const profileData: ProfileData = {
    full_name: profile?.full_name ?? meta.full_name ?? "",
    country: profile?.country ?? "",
    grade: profile?.grade ?? "",
    learning_goal: profile?.learning_goal ?? "",
    target_degree: profile?.target_degree ?? "",
    preferred_language: profile?.preferred_language ?? "English",
  };

  return (
    <SettingsClient
      userId={user.id}
      email={user.email ?? ""}
      userName={profileData.full_name || "Learner"}
      memberSince={profile?.created_at ?? user.created_at}
      projectRef={projectRef}
      profile={profileData}
      initialTab={initialTab}
      settings={
        settings
          ? {
              daily_goal_minutes:
                settings.daily_goal_minutes ?? DEFAULT_SETTINGS.daily_goal_minutes,
            }
          : DEFAULT_SETTINGS
      }
    />
  );
}
