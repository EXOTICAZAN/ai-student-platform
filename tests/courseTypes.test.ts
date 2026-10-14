import { describe, expect, it } from "vitest";
import { normalizeGeneratedCourse, safeYouTubeUrl } from "@/lib/courses/types";

describe("course helpers", () => {
  it("allows only safe YouTube watch/results URLs", () => {
    expect(safeYouTubeUrl("https://www.youtube.com/watch?v=abc", "TypeScript")).toContain("watch?v=abc");
    expect(safeYouTubeUrl("https://example.com/video", "TypeScript")).toContain("results?search_query=TypeScript");
  });
  it("normalizes model output and supplies safe fallback videos", () => {
    const course = normalizeGeneratedCourse({ title: "Test", modules: [{ title: "One", videos: [{ title: "Lesson", url: "bad" }] }] }, "React");
    expect(course.skill_level).toBe("beginner");
    expect(course.modules[0].videos[0].url).toContain("youtube.com/results");
  });
});
