import { z } from "zod";

export const onboardingSchema = z.object({
  country: z.string().trim().min(2).max(80),
  education_level: z.string().trim().min(2).max(80),
  grade: z.string().trim().min(1).max(80),
  learning_goal: z.string().trim().min(3).max(240),
  target_degree: z.string().trim().min(2).max(120),
  preferred_language: z.string().trim().min(2).max(40),
  weekly_study_minutes: z.coerce.number().int().min(30).max(10080),
  interests: z.array(z.string().trim().min(1).max(60)).max(20),
  career_goal: z.string().trim().min(2).max(160),
});
export type OnboardingInput = z.infer<typeof onboardingSchema>;
export function parseOnboardingInput(input: unknown) { return onboardingSchema.safeParse(input); }
