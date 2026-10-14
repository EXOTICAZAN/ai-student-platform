import { describe, expect, it } from "vitest";
import { gradeCheck, sanitizeCheckQuestions, validateCheckQuestions } from "@/lib/courses/check";

const questions = [
  { question: "One?", options: ["A", "B"], answer: "A" },
  { question: "Two?", options: ["A", "B"], answer: "B" },
  { question: "Three?", options: ["A", "B"], answer: "A" },
];

describe("course check grading", () => {
  it("sanitizes answer keys before sending questions to the browser", () => {
    expect(sanitizeCheckQuestions(questions)).toEqual([
      { question: "One?", options: ["A", "B"] },
      { question: "Two?", options: ["A", "B"] },
      { question: "Three?", options: ["A", "B"] },
    ]);
  });

  it("grades submitted answers against stored keys", () => {
    expect(gradeCheck(questions, ["A", "B", "B"])).toMatchObject({ score: 67, passed: false });
    expect(gradeCheck(questions, ["A", "B", "A"])).toMatchObject({ score: 100, passed: true });
    expect(gradeCheck(questions, ["A"])).toBeNull();
  });

  it("rejects malformed generated questions", () => {
    expect(validateCheckQuestions(questions)).toHaveLength(3);
    expect(validateCheckQuestions([{ ...questions[0], answer: "not an option" }])).toEqual([]);
  });
});
