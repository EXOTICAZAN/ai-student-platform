import { describe, expect, it } from "vitest";
import { careerGoalSchema, fallbackRoadmap, roadmapSchema } from "@/lib/career-roadmap/validation";
import { isAdminEmail } from "@/lib/admin/validation";
describe("personalization validation", () => { it("rejects unsafe oversized goals", () => expect(careerGoalSchema.safeParse({goal:"x".repeat(161)}).success).toBe(false)); });
describe("roadmap helpers", () => { it("fallback is valid and useful", () => { const result = fallbackRoadmap("teacher"); expect(roadmapSchema.safeParse(result).success).toBe(true); expect(result.next_steps.length).toBeGreaterThan(0); }); });
describe("admin authorization", () => { it("matches only configured emails", () => { expect(isAdminEmail("Admin@example.com", "admin@example.com, other@example.com")).toBe(true); expect(isAdminEmail("user@example.com", "admin@example.com")).toBe(false); }); });
