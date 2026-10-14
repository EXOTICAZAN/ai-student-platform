import type { QuizDifficulty } from "@/lib/study/types";

export const LETTERS = ["A", "B", "C", "D"] as const;

export function percent(score: number, total: number): number {
  return total > 0 ? Math.round((score / total) * 100) : 0;
}

export const DIFFICULTY_TONE: Record<
  QuizDifficulty,
  "emerald" | "amber" | "rose" | "indigo"
> = {
  easy: "emerald",
  medium: "amber",
  hard: "rose",
  mixed: "indigo",
};

export function scoreTone(pct: number): "emerald" | "amber" | "rose" {
  if (pct >= 80) return "emerald";
  if (pct >= 60) return "amber";
  return "rose";
}
