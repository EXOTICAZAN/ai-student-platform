export interface GeneratedCheckQuestion {
  question: string;
  options: string[];
  answer: string;
}

export interface SanitizedCheckQuestion {
  question: string;
  options: string[];
}

export function validateCheckQuestions(value: unknown): GeneratedCheckQuestion[] {
  if (!Array.isArray(value) || value.length !== 3) return [];

  const questions: GeneratedCheckQuestion[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object") return [];
    const source = item as Record<string, unknown>;
    const question = typeof source.question === "string" ? source.question.trim().slice(0, 500) : "";
    const options = Array.isArray(source.options)
      ? source.options.filter((option): option is string => typeof option === "string").map((option) => option.trim().slice(0, 300))
      : [];
    const answer = typeof source.answer === "string" ? source.answer.trim().slice(0, 300) : "";
    if (!question || options.length < 2 || options.length > 5 || new Set(options).size !== options.length || !answer || !options.includes(answer)) return [];
    questions.push({ question, options, answer });
  }
  return questions;
}

export function sanitizeCheckQuestions(questions: GeneratedCheckQuestion[]): SanitizedCheckQuestion[] {
  return questions.map(({ question, options }) => ({ question, options }));
}

export function gradeCheck(questions: GeneratedCheckQuestion[], answers: unknown): { scores: boolean[]; score: number; passed: boolean } | null {
  if (!Array.isArray(answers) || answers.length !== questions.length || answers.some((answer) => typeof answer !== "string")) return null;
  const scores = questions.map((question, index) => question.answer === answers[index]);
  const score = Math.round((scores.filter(Boolean).length / questions.length) * 100);
  return { scores, score, passed: score >= 70 };
}
