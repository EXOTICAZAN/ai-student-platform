import { describe, expect, it } from "vitest";
import { extractJson } from "@/lib/ai/groq";

describe("extractJson", () => {
  it("parses plain JSON", () => {
    expect(extractJson('{"a":1}')).toEqual({ a: 1 });
  });

  it("strips markdown fences", () => {
    expect(extractJson('```json\n{"a":1}\n```')).toEqual({ a: 1 });
  });

  it("finds the object inside a preamble", () => {
    expect(extractJson('Sure! Here you go: {"a":{"b":2}} Hope that helps.')).toEqual({
      a: { b: 2 },
    });
  });

  it("handles top-level arrays", () => {
    expect(extractJson('Result: [1,2,3]')).toEqual([1, 2, 3]);
  });

  it("throws when there is no JSON", () => {
    expect(() => extractJson("no json here")).toThrow();
  });
});
