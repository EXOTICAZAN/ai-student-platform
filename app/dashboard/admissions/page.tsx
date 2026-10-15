import { redirect } from "next/navigation";
import { getAuthContext } from "@/lib/supabase/server";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { AdmissionsHub } from "@/components/dashboard/PakistanHubClient";
export default async function AdmissionsPage(){ const { user } = await getAuthContext(); if(!user) redirect("/login"); return <DashboardShell><AdmissionsHub/></DashboardShell>; }
