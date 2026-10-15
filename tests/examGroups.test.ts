import { describe, expect, it } from "vitest";
import { createGroupSchema, EXAM_CATALOGUE, postSchema } from "@/lib/exam-groups";

describe("exam group helpers", () => {
  it("keeps the requested entrance-exam catalogue", () => {
    expect(EXAM_CATALOGUE.map((exam) => exam.key)).toEqual(["NET", "ECAT", "MDCAT", "LUMS", "NTS", "FAST", "GIKI", "PIEAS", "UNIVERSITY", "OTHER"]);
  });
  it("validates and defaults group details", () => {
    const result = createGroupSchema.safeParse({ exam_key: "NET", exam_name: "NET", title: "Math accountability" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.max_members).toBe(50);
    expect(createGroupSchema.safeParse({ exam_key: "INVALID", title: "x" }).success).toBe(false);
  });
  it("requires a useful post and accepts a URL", () => {
    expect(postSchema.safeParse({ body: "Try this question", resource_url: "https://example.com" }).success).toBe(true);
    expect(postSchema.safeParse({ body: "" }).success).toBe(false);
    expect(postSchema.safeParse({ body: "A", resource_url: "not-a-url" }).success).toBe(false);
  });
});
