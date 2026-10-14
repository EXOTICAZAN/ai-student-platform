import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import DashboardShell from "@/components/dashboard/DashboardShell";
import CareerRoadmapClient from "@/components/career-roadmap/CareerRoadmapClient";
export default async function CareerRoadmapPage() { const supabase=await createClient(); const {data:{user}}=await supabase.auth.getUser(); if(!user)redirect("/login"); const {data:profile}=await supabase.from("profiles").select("career_goal").eq("id",user.id).maybeSingle(); return <DashboardShell userName={user.email??"Learner"} userEmail={user.email}><CareerRoadmapClient initialGoal={profile?.career_goal}/></DashboardShell>; }
