import { describe, expect, it } from "vitest";
import { selectCourse } from "@/lib/courses/selection";

const courses = [
  { id: "11111111-1111-4111-8111-111111111111", title: "Newest", created_at: "2026-01-02" },
  { id: "22222222-2222-4222-8222-222222222222", title: "Older", created_at: "2026-01-01" },
];

describe("selectCourse", () => {
  it("selects a requested course from the owned list", () => expect(selectCourse(courses, courses[1].id)?.title).toBe("Older"));
  it("falls back to newest for malformed or unknown IDs", () => {
    expect(selectCourse(courses, "not-a-uuid")?.title).toBe("Newest");
    expect(selectCourse(courses, "33333333-3333-4333-8333-333333333333")?.title).toBe("Newest");
  });
  it("returns no course for the create-new view", () => expect(selectCourse(courses, courses[0].id, true)).toBeNull());
});
