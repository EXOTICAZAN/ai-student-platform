import OpenAI from "openai";
import { STREAM_ERROR_PREFIX } from "./stream-protocol";

// =============================================================
// Shared Groq access layer.
//
// Groq speaks the OpenAI wire format, so the already-installed
// `openai` client is pointed at Groq's base URL rather than adding
// the `groq-sdk` package. Everything that needs structured output
// goes through generateJson(); everything that needs streaming goes
// through streamText().
//
// Model ids are the ones verified against this project's API key.
// Override with env vars if the catalogue changes.
// =============================================================

const BASE_URL = "https://api.groq.com/openai/v1";

// qwen3.8 streams plain content deltas with no reasoning overhead, which
// keeps time-to-first-token predictable for the tutor.
export const CHAT_MODEL =
  process.env.GROQ_CHAT_MODEL ?? "qwen/qwen3.8-27b";

// gpt-oss-120b produces the most reliable structured output of the
// models this key can reach.
export const JSON_MODEL =
  process.env.GROQ_JSON_MODEL ?? "openai/gpt-oss-120b";

// Reasoning models burn completion tokens before emitting any content,
// so a tight cap silently yields an empty answer.
const CHAT_MAX_TOKENS = Number(process.env.GROQ_CHAT_MAX_TOKENS ?? 4096);

export type ChatRole = "system" | "user" | "assistant";

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

let cached: OpenAI | null = null;

export function getGroq(): OpenAI {
  if (cached) return cached;

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("GROQ_API_KEY is not configured");
  }

  cached = new OpenAI({ apiKey, baseURL: BASE_URL });
  return cached;
}

// ------------------------------------------------------------------
// Defensive JSON extraction
// Models occasionally wrap output in ``` fences or add a preamble even
// when told not to, so we locate the outermost braces.
// ------------------------------------------------------------------

export function extractJson(raw: string): unknown {
  const cleaned = raw
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    // fall through to brace slicing
  }

  const start = cleaned.indexOf("{");
  const startArr = cleaned.indexOf("[");
  const first =
    start === -1
      ? startArr
      : startArr === -1
        ? start
        : Math.min(start, startArr);

  const last = Math.max(
    cleaned.lastIndexOf("}"),
    cleaned.lastIndexOf("]")
  );

  if (first !== -1 && last > first) {
    return JSON.parse(cleaned.slice(first, last + 1));
  }

  throw new Error("Model did not return parseable JSON");
}

// ------------------------------------------------------------------
// generateText — raw completion, no JSON enforcement
// For callers that run their own tolerant parsing and fallback.
// ------------------------------------------------------------------

export interface GenerateTextOptions {
  systemPrompt: string;
  prompt: string;
  temperature?: number;
  maxOutputTokens?: number;
  /** Enforce response_format=json_object. */
  json?: boolean;
}

export async function generateText(
  options: GenerateTextOptions
): Promise<string> {
  const {
    systemPrompt,
    prompt,
    temperature = 0.2,
    maxOutputTokens = 8192,
    json = false,
  } = options;

  const completion = await getGroq().chat.completions.create({
    model: JSON_MODEL,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: prompt },
    ],
    temperature,
    max_tokens: maxOutputTokens,
    ...(json ? { response_format: { type: "json_object" as const } } : {}),
  });

  return completion.choices[0]?.message?.content ?? "";
}

// ------------------------------------------------------------------
// generateJson — non-streaming structured output
// ------------------------------------------------------------------

export interface GenerateJsonOptions {
  /** System instruction. Should end by describing the exact JSON shape. */
  systemPrompt: string;
  /** User turn. */
  prompt: string;
  temperature?: number;
  maxOutputTokens?: number;
}

/**
 * Runs a completion with response_format=json_object and parses it.
 * Throws on network/parse failure — callers decide how to surface it.
 */
export async function generateJson<T>(
  options: GenerateJsonOptions
): Promise<T> {
  const raw = await generateText({ ...options, json: true });

  if (!raw.trim()) {
    throw new Error("Model returned an empty response");
  }

  return extractJson(raw) as T;
}

// ------------------------------------------------------------------
// streamText — streaming completion
// ------------------------------------------------------------------

/**
 * Builds the ReadableStream response used by the tutor: raw UTF-8 text
 * chunks, no SSE framing.
 */
export function streamText(
  messages: ChatMessage[],
  onError?: (error: unknown) => void
): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        const stream = await getGroq().chat.completions.create({
          model: CHAT_MODEL,
          messages,
          stream: true,
          max_tokens: CHAT_MAX_TOKENS,
        });

        for await (const chunk of stream) {
          // Reasoning models emit `reasoning` deltas ahead of `content`.
          // Only content belongs in the tutor transcript.
          const text = chunk.choices[0]?.delta?.content;
          if (text) {
            controller.enqueue(encoder.encode(text));
          }
        }
      } catch (error) {
        onError?.(error);
        // The response has already started, so the error cannot become an
        // HTTP status. Send a private, machine-readable terminal marker so
        // the client never treats a failed/empty stream as a successful reply.
        controller.enqueue(
          encoder.encode(`${STREAM_ERROR_PREFIX}generation_failed`)
        );
      } finally {
        controller.close();
      }
    },
  });
}

export const STREAM_HEADERS = {
  "Content-Type": "text/plain; charset=utf-8",
  "Cache-Control": "no-cache, no-transform",
  Connection: "keep-alive",
} as const;
