"use server";
import { createClient } from "@/lib/supabase/server";
import { generateJson } from "@/lib/ai/groq";
import { consume } from "@/lib/api/rateLimit";
import { careerGoalSchema, roadmapSchema, fallbackRoadmap, type Roadmap } from "@/lib/career-roadmap/validation";
export async function generateCareerRoadmap(input: unknown): Promise<{ ok: true; data: Roadmap } | { ok: false; error: string }> {
  const parsed = careerGoalSchema.safeParse(input); if (!parsed.success) return { ok: false, error: "Enter a career goal between 2 and 160 characters." };
  const supabase = await createClient(); const { data: { user } } = await supabase.auth.getUser(); if (!user) return { ok: false, error: "You must be signed in." };
  const limited = await consume("career-roadmap", user.id, 5, 60_000); if (!limited.ok) return { ok: false, error: "Too many requests. Please try again shortly." };
  const { error: profileError } = await supabase
    .from("profiles")
    .update({ career_goal: parsed.data.goal })
    .eq("id", user.id);
  if (profileError) {
    console.error("[career-roadmap] goal save failed", profileError.message);
    return { ok: false, error: "Could not save your career goal. Please try again." };
  }
  try { const data = await generateJson<Roadmap>({ systemPrompt: "Return only JSON matching this shape: {milestones:[{title,timeframe,description}],skills:[],recommended_courses:[],next_steps:[]}. Keep it practical and concise.", prompt: `Create a realistic learning roadmap for this career goal: ${parsed.data.goal}` }); const valid = roadmapSchema.safeParse(data); if (valid.success) return { ok: true, data: valid.data }; } catch (error) { console.error("[career-roadmap] generation failed", error); }
  return { ok: true, data: fallbackRoadmap(parsed.data.goal) };
}
