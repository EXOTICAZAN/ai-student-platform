import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { AdmissionsHub } from "@/components/dashboard/PakistanHubClient";
export default async function AdmissionsPage(){ const supabase=await createClient(); const {data:{user}}=await supabase.auth.getUser(); if(!user) redirect("/login"); return <DashboardShell><AdmissionsHub/></DashboardShell>; }
