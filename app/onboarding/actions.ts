"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { onboardingSchema, type OnboardingInput } from "@/lib/onboarding/validation";
import { consume } from "@/lib/api/rateLimit";

export async function completeOnboarding(input: OnboardingInput) {
  const parsed = onboardingSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "Please complete each field with valid information." };
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: "You must be signed in." };
  const limited = await consume("onboarding", user.id, 5, 60_000);
  if (!limited.ok) return { ok: false as const, error: "Too many attempts. Please try again shortly." };
  const value = parsed.data;
  const { error } = await supabase.from("profiles").upsert({
    id: user.id, email: user.email ?? null, country: value.country,
    grade: `${value.education_level} — ${value.grade}`, learning_goal: value.learning_goal,
    target_degree: value.target_degree, preferred_language: value.preferred_language,
    weekly_study_minutes: value.weekly_study_minutes, interests: value.interests,
    career_goal: value.career_goal, onboarding_complete: true,
  });
  if (error) { console.error("[onboarding] save failed", error.message); return { ok: false as const, error: "Could not save your onboarding details." }; }
  await supabase.from("user_settings").upsert({ user_id: user.id, daily_goal_minutes: Math.max(15, Math.round(value.weekly_study_minutes / 7)) }, { onConflict: "user_id" });
  revalidatePath("/dashboard"); revalidatePath("/dashboard/settings");
  return { ok: true as const };
}
