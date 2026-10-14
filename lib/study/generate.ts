import { generateJson } from "@/lib/ai/groq";
import type {
  GeneratedFlashcard,
  GeneratedNote,
  GeneratedQuiz,
  GeneratedTask,
  QuizDifficulty,
} from "@/lib/study/types";

// =============================================================
// Prompt + parsing layer for every generative feature.
//
// Route handlers stay thin: they authenticate, gather context
// (optionally RAG chunks), call one of these, and persist.
// =============================================================

const JSON_ONLY =
  "Respond with ONLY a valid JSON object matching the given schema. " +
  "No markdown, no code fences, no commentary before or after.";

function asArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((v): v is string => typeof v === "string" && v.trim() !== "")
    : [];
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" && value.trim() ? value : fallback;
}

// ------------------------------------------------------------------
// Notes
// ------------------------------------------------------------------

export interface NoteFromTopicInput {
  topic: string;
  subject?: string;
  /** "concise" | "standard" | "deep" */
  depth?: "concise" | "standard" | "deep";
  level?: string;
}

const DEPTH_GUIDANCE: Record<string, string> = {
  concise: "Aim for a tight one-page brief: 4-6 sections, ~400 words.",
  standard: "Aim for a thorough study note: 6-8 sections, ~900 words.",
  deep: "Aim for an in-depth reference: 8-12 sections, ~1800 words.",
};

export async function generateNoteFromTopic(
  input: NoteFromTopicInput
): Promise<GeneratedNote> {
  const depth = input.depth ?? "standard";

  const systemPrompt = `You are EduForge AI, an expert study-notes writer for students.
You produce clear, accurate, well-structured markdown study notes.

Rules:
- Use markdown: headings (##, ###), bullet lists, tables where they help, and **bold** for key terms.
- ${DEPTH_GUIDANCE[depth]}
- Write for a ${input.level || "university"} student.
- Include a "Key takeaways" section at the end with 3-6 bullets.
- Never invent citations, URLs, or fake statistics.
- Use LaTeX between $...$ only when a formula genuinely helps.

${JSON_ONLY}

Schema:
{
  "title": string,          // concise, specific title
  "subject": string,        // short subject label, e.g. "Linear Algebra"
  "summary": string,        // 1-2 sentence overview
  "content": string,        // the full markdown note
  "tags": string[],         // 3-6 short topic tags
  "key_points": string[]    // 3-6 most important facts
}`;

  const raw = await generateJson<Record<string, unknown>>({
    systemPrompt,
    prompt: `Write study notes on: ${input.topic}${
      input.subject ? `\nSubject area: ${input.subject}` : ""
    }`,
    maxOutputTokens: 8192,
  });

  return normalizeNote(raw, input.topic, input.subject);
}

export interface NoteFromSourceInput {
  /** Raw text, pasted content, or concatenated RAG chunks. */
  source: string;
  topic?: string;
  subject?: string;
  sourceType?: "pdf" | "text";
}

export async function generateNoteFromSource(
  input: NoteFromSourceInput
): Promise<GeneratedNote> {
  const truncated = input.source.slice(0, 60_000);

  const systemPrompt = `You are EduForge AI, an expert at turning raw source material into structured study notes.

Rules:
- Base the notes strictly on the supplied source material. Do not add facts that are not present or clearly implied.
- Preserve important definitions, formulas, dates and numbers exactly.
- Output clean markdown with headings, bullets, and tables where useful.
- End with a "Key takeaways" section of 3-6 bullets.
- If the source is too fragmented to cover a topic, say so in the summary.

${JSON_ONLY}

Schema:
{
  "title": string,
  "subject": string,
  "summary": string,
  "content": string,
  "tags": string[],
  "key_points": string[]
}`;

  const raw = await generateJson<Record<string, unknown>>({
    systemPrompt,
    prompt: `${input.sourceType === "pdf" ? "PDF" : "Pasted"} source material${
      input.topic ? ` about "${input.topic}"` : ""
    }:\n\n"""\n${truncated}\n"""`,
    maxOutputTokens: 8192,
  });

  return normalizeNote(
    raw,
    input.topic ?? "Untitled note",
    input.subject
  );
}

function normalizeNote(
  raw: Record<string, unknown>,
  fallbackTitle: string,
  fallbackSubject?: string
): GeneratedNote {
  return {
    title: asString(raw.title, fallbackTitle).slice(0, 200),
    subject: asString(raw.subject, fallbackSubject ?? ""),
    summary: asString(raw.summary),
    content: asString(raw.content),
    tags: asArray(raw.tags).slice(0, 8),
    key_points: asArray(raw.key_points).slice(0, 8),
  };
}

/** Condense an existing note body into a short summary. */
export async function summarizeContent(content: string): Promise<string> {
  const systemPrompt = `You are EduForge AI. Summarise the given study material in 2-3 sentences.
Plain text only, no markdown, no preamble.`;

  const raw = await generateJson<{ summary?: string } | string>({
    systemPrompt: `${systemPrompt}\n\n${JSON_ONLY}\n\nSchema: { "summary": string }`,
    prompt: content.slice(0, 40_000),
    temperature: 0.1,
    maxOutputTokens: 512,
  });

  if (typeof raw === "string") return raw.trim();
  return asString(raw?.summary).trim();
}

// ------------------------------------------------------------------
// Flashcards
// ------------------------------------------------------------------

export interface FlashcardGenInput {
  topic?: string;
  subject?: string;
  source?: string;
  count?: number;
  level?: string;
}

export async function generateFlashcards(
  input: FlashcardGenInput
): Promise<GeneratedFlashcard[]> {
  const count = Math.min(Math.max(input.count ?? 12, 4), 30);

  const systemPrompt = `You are EduForge AI, creating spaced-repetition flashcards.

Rules:
- Each card tests ONE atomic fact or concept.
- "front" is a question or prompt; "back" is a short, precise answer (max ~40 words).
- Avoid yes/no questions; prefer recall questions.
- Never duplicate a concept across cards.
- "hint" is optional: a one-line nudge, not the answer.
${input.source ? "- Derive every card strictly from the supplied source material." : `- Cover the topic thoroughly at a ${input.level || "university"} level.`}

${JSON_ONLY}

Schema:
{
  "cards": [
    { "front": string, "back": string, "hint": string }
  ]
}`;

  const prompt = input.source
    ? `Create ${count} flashcards from this material${
        input.topic ? ` about "${input.topic}"` : ""
      }:\n\n"""\n${input.source.slice(0, 50_000)}\n"""`
    : `Create ${count} flashcards on: ${input.topic ?? "the given subject"}${
        input.subject ? `\nSubject: ${input.subject}` : ""
      }`;

  const raw = await generateJson<{ cards?: unknown }>({
    systemPrompt,
    prompt,
    maxOutputTokens: 8192,
  });

  const cards = Array.isArray(raw?.cards) ? raw.cards : [];

  return cards
    .map((card) => {
      const c = card as Record<string, unknown>;
      return {
        front: asString(c?.front),
        back: asString(c?.back),
        hint: asString(c?.hint) || undefined,
      };
    })
    .filter((c) => c.front && c.back)
    .slice(0, count);
}

// ------------------------------------------------------------------
// Quizzes
// ------------------------------------------------------------------

export interface QuizGenInput {
  topic?: string;
  subject?: string;
  source?: string;
  count?: number;
  difficulty?: QuizDifficulty;
  level?: string;
}

const DIFFICULTY_GUIDANCE: Record<QuizDifficulty, string> = {
  easy: "Recall and definition-level questions. Most students should get these right.",
  medium: "Application and comprehension questions requiring some reasoning.",
  hard: "Analysis, synthesis and edge-case questions that test deep understanding.",
  mixed: "A blend: roughly a third easy, a third medium, a third hard.",
};

export async function generateQuiz(
  input: QuizGenInput
): Promise<GeneratedQuiz> {
  const count = Math.min(Math.max(input.count ?? 8, 3), 25);
  const difficulty = input.difficulty ?? "mixed";

  const systemPrompt = `You are EduForge AI, writing multiple-choice quizzes for students.

Rules:
- Exactly 4 options per question, one correct answer.
- Distractors must be plausible and clearly wrong to someone who knows the material. Avoid "all of the above" and "none of the above".
- Vary which option index is correct — do not always use index 0.
- correct_index is the 0-based position of the right answer in "options".
- Each "explanation" teaches why the answer is correct and why the main distractor is wrong (1-3 sentences).
- Difficulty: ${DIFFICULTY_GUIDANCE[difficulty]}
${input.source ? "- Derive every question strictly from the supplied source material." : `- Questions must be about: ${input.topic ?? "the given subject"}.`}

${JSON_ONLY}

Schema:
{
  "title": string,
  "subject": string,
  "questions": [
    {
      "question": string,
      "options": string[4],
      "correct_index": number,
      "explanation": string
    }
  ]
}`;

  const prompt = input.source
    ? `Write ${count} multiple-choice questions from this material${
        input.topic ? ` about "${input.topic}"` : ""
      }:\n\n"""\n${input.source.slice(0, 50_000)}\n"""`
    : `Write ${count} multiple-choice questions on: ${input.topic ?? "the given subject"}${
        input.subject ? `\nSubject: ${input.subject}` : ""
      }`;

  const raw = await generateJson<Record<string, unknown>>({
    systemPrompt,
    prompt,
    maxOutputTokens: 8192,
  });

  const questions = Array.isArray(raw?.questions) ? raw.questions : [];

  const normalized = questions
    .map((q) => {
      const item = q as Record<string, unknown>;
      const options = asArray(item?.options).slice(0, 4);
      const rawIndex = Number(item?.correct_index);
      const correctIndex =
        Number.isInteger(rawIndex) && rawIndex >= 0 && rawIndex < options.length
          ? rawIndex
          : 0;

      return {
        question: asString(item?.question),
        options,
        correct_index: correctIndex,
        explanation: asString(item?.explanation),
      };
    })
    .filter((q) => q.question && q.options.length >= 2)
    .slice(0, count);

  if (normalized.length === 0) {
    throw new Error("The model did not return any usable questions.");
  }

  return {
    title: asString(raw?.title, input.topic ?? "Quiz").slice(0, 200),
    subject: asString(raw?.subject, input.subject ?? ""),
    questions: normalized,
  };
}

// ------------------------------------------------------------------
// Study plans
// ------------------------------------------------------------------

export interface PlanGenInput {
  goal: string;
  subject?: string;
  days?: number;
  minutesPerDay?: number;
  examDate?: string;
  /** Topics the learner wants covered, or weak areas. */
  focusAreas?: string[];
}

export async function generateStudyPlan(
  input: PlanGenInput
): Promise<GeneratedTask[]> {
  const days = Math.min(Math.max(input.days ?? 7, 1), 30);
  const minutes = Math.min(Math.max(input.minutesPerDay ?? 60, 15), 480);

  const systemPrompt = `You are EduForge AI, an expert study planner.
Break a learning goal into a realistic, day-by-day schedule.

Rules:
- Tasks must be concrete and actionable ("Practise 10 eigenvector problems"), never vague ("Study maths").
- Front-load foundations, leave the final day for review and self-testing.
- Each task's duration_minutes should sum to roughly ${minutes} per day.
- offset_days is 0 for today, 1 for tomorrow, up to ${days - 1}.
- priority: "high" for foundational or deadline-critical work, "medium" for practice, "low" for optional enrichment.
- Between ${days * 2} and ${days * 3} tasks in total.

${JSON_ONLY}

Schema:
{
  "tasks": [
    {
      "title": string,
      "description": string,
      "subject": string,
      "priority": "low" | "medium" | "high",
      "duration_minutes": number,
      "offset_days": number
    }
  ]
}`;

  const prompt = `Goal: ${input.goal}
${input.subject ? `Subject: ${input.subject}` : ""}
Plan length: ${days} days, about ${minutes} minutes per day.
${input.examDate ? `Target/exam date: ${input.examDate}` : ""}
${
  input.focusAreas?.length
    ? `Focus areas: ${input.focusAreas.join(", ")}`
    : ""
}`.trim();

  const raw = await generateJson<{ tasks?: unknown }>({
    systemPrompt,
    prompt,
    maxOutputTokens: 8192,
  });

  const tasks = Array.isArray(raw?.tasks) ? raw.tasks : [];

  const normalized = tasks
    .map((t) => {
      const item = t as Record<string, unknown>;
      const priority = ["low", "medium", "high"].includes(
        String(item?.priority)
      )
        ? (String(item.priority) as GeneratedTask["priority"])
        : "medium";

      const offset = Number(item?.offset_days);
      const duration = Number(item?.duration_minutes);

      return {
        title: asString(item?.title),
        description: asString(item?.description),
        subject: asString(item?.subject),
        priority,
        duration_minutes:
          Number.isFinite(duration) && duration > 0
            ? Math.min(Math.round(duration), 480)
            : 30,
        offset_days:
          Number.isFinite(offset) && offset >= 0
            ? Math.min(Math.round(offset), days - 1)
            : 0,
      };
    })
    .filter((t) => t.title);

  if (normalized.length === 0) {
    throw new Error("The model did not return a usable plan.");
  }

  return normalized;
}
