import type { Metadata } from "next";
import { redirect } from "next/navigation";
import DashboardProviders from "@/components/dashboard/DashboardProviders";
import { getAuthContext } from "@/lib/supabase/server";

// Everything under /dashboard is behind auth, so it must never be indexed.
// Declaring it once here covers every child route, including the ones that
// are client components and cannot export metadata themselves.
export const metadata: Metadata = {
  title: "Dashboard — EduForge AI",
  robots: { index: false, follow: false },
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { supabase, user } = await getAuthContext();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("preferred_language")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <DashboardProviders initialLanguage={profile?.preferred_language}>
      {children}
    </DashboardProviders>
  );
}
