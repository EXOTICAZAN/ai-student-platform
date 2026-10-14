import { describe, expect, it } from "vitest";
import { parseOnboardingInput } from "@/lib/onboarding/validation";
import { careerGoalSchema, fallbackRoadmap, roadmapSchema } from "@/lib/career-roadmap/validation";
import { isAdminEmail } from "@/lib/admin/validation";
describe("personalization validation", () => { it("accepts a complete onboarding payload", () => { expect(parseOnboardingInput({ country:"PK", education_level:"High school", grade:"11", learning_goal:"Prepare", target_degree:"BS CS", preferred_language:"English", weekly_study_minutes:300, interests:["math"], career_goal:"Developer" }).success).toBe(true); }); it("rejects unsafe oversized goals", () => expect(careerGoalSchema.safeParse({goal:"x".repeat(161)}).success).toBe(false)); });
describe("roadmap helpers", () => { it("fallback is valid and useful", () => { const result = fallbackRoadmap("teacher"); expect(roadmapSchema.safeParse(result).success).toBe(true); expect(result.next_steps.length).toBeGreaterThan(0); }); });
describe("admin authorization", () => { it("matches only configured emails", () => { expect(isAdminEmail("Admin@example.com", "admin@example.com, other@example.com")).toBe(true); expect(isAdminEmail("user@example.com", "admin@example.com")).toBe(false); }); });
