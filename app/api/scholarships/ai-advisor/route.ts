import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateText } from "@/lib/ai/groq";
import {
  getStudentProfile,
  getScholarshipsWithRequirements,
} from "@/lib/scholarships/query";
import { matchScholarship } from "@/lib/scholarships/matching";
import { z } from "zod";
import { consume } from "@/lib/api/rateLimit";
import { readJson } from "@/lib/api/guard";
import type { AIAdvisorResponse } from "@/lib/scholarships/types";

const RequestSchema = z.object({
  question: z.string().min(1).max(1000).transform((s) => s.trim()),
  scholarship_ids: z.array(z.string().uuid()).max(5).optional(),
});

// Safely parse model JSON output — handles empty, truncated, and markdown-wrapped responses
function parseAdvisorJson(raw: string, fallbackText: string, officialSources: { name: string; url: string }[]): AIAdvisorResponse {
  const DISCLAIMER = "Always verify all information on the official scholarship websites before applying. Requirements may have changed.";

  if (!raw || raw.trim() === "") {
    return {
      recommendation: fallbackText || "I was unable to generate a response. Please try again.",
      why_it_matches: [],
      potential_issues: [],
      missing_info: [],
      official_sources: officialSources,
      disclaimer: DISCLAIMER,
    };
  }

  // Strip markdown code fences (```json ... ``` or ``` ... ```)
  let cleaned = raw
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```\s*$/i, "")
    .trim();

  // Find the first { and last } to extract the JSON object
  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");

  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.slice(firstBrace, lastBrace + 1);
  }

  try {
    const parsed = JSON.parse(cleaned) as Partial<AIAdvisorResponse>;

    // Validate the parsed object has the expected shape
    return {
      recommendation: typeof parsed.recommendation === "string" && parsed.recommendation
        ? parsed.recommendation
        : "Please check the official scholarship website for detailed information.",
      why_it_matches: Array.isArray(parsed.why_it_matches) ? parsed.why_it_matches : [],
      potential_issues: Array.isArray(parsed.potential_issues) ? parsed.potential_issues : [],
      missing_info: Array.isArray(parsed.missing_info) ? parsed.missing_info : [],
      // URLs are database-authoritative. Never render model-supplied links.
      official_sources: officialSources,
      disclaimer: typeof parsed.disclaimer === "string" && parsed.disclaimer
        ? parsed.disclaimer
        : DISCLAIMER,
    };
  } catch {
    // JSON parse failed — return the raw text as the recommendation
    return {
      recommendation: cleaned.length > 20
        ? cleaned
        : "I was unable to generate a structured response. Please try again.",
      why_it_matches: [],
      potential_issues: [],
      missing_info: [],
      official_sources: officialSources,
      disclaimer: DISCLAIMER,
    };
  }
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { data: null, error: { code: "UNAUTHORIZED", message: "Authentication required" } },
      { status: 401 }
    );
  }

  const limit = await consume("scholarship_advisor", user.id, 10);
  if (!limit.ok) {
    return NextResponse.json(
      {
        data: null,
        error: {
          code: "RATE_LIMIT",
          message: "Too many requests. Please wait a moment before asking again.",
        },
      },
      { status: 429, headers: { "Retry-After": String(Math.max(1, Math.ceil(limit.retryAfterMs / 1000))) } }
    );
  }

  const body = await readJson<unknown>(request);
  if (body === null) {
    return NextResponse.json(
      { data: null, error: { code: "BAD_REQUEST", message: "Invalid JSON body" } },
      { status: 400 }
    );
  }

  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        data: null,
        error: {
          code: "VALIDATION_ERROR",
          message: parsed.error.issues.map((i) => i.message).join(", "),
        },
      },
      { status: 422 }
    );
  }

  const { question, scholarship_ids } = parsed.data;

  // Fetch student profile (server-side only)
  const profileResult = await getStudentProfile(user.id);
  const profile = profileResult.data;

  // Fetch relevant scholarships
  const scholarships = await getScholarshipsWithRequirements(scholarship_ids);

  // Build official sources list for fallback use
  const officialSources = scholarships.map((s) => ({
    name: s.name,
    url: s.official_source_url,
  }));

  // No data at all — return helpful guidance without calling the model
  if (scholarships.length === 0 && !profile) {
    return NextResponse.json(
      {
        data: {
          recommendation:
            "Please complete your scholarship profile and explore some scholarships first so I can give you personalized advice.",
          why_it_matches: [],
          potential_issues: [],
          missing_info: ["Complete your scholarship profile to get started."],
          official_sources: [],
          disclaimer:
            "This is AI-generated guidance only. Always verify all scholarship details on the official websites before applying.",
        } satisfies AIAdvisorResponse,
        error: null,
      },
      { status: 200 }
    );
  }

  // Build match context
  const matchContext = profile
    ? scholarships
        .map((s) => {
          const match = matchScholarship(s, profile);
          return {
            name: s.name,
            provider: s.provider_name,
            country: s.country_name,
            degrees: s.degree_levels.join(", "),
            fields: s.fields.join(", "),
            funding: s.funding_type,
            deadline: s.application_deadline ?? "Not specified",
            official_url: s.official_source_url,
            match_score: match.score,
            match_category: match.category,
            strong_matches: match.strong_matches.map((r) => r.description).join("; "),
            issues: match.potential_issues.map((r) => r.reason).join("; "),
            missing: match.missing_info.map((r) => r.reason).join("; "),
            failed: match.failed_mandatory.map((r) => r.description).join("; "),
          };
        })
        .slice(0, 5)
    : [];

  const systemPrompt = `You are EduForge AI's Scholarship Advisor. Help students understand scholarships based ONLY on the verified data below. Never invent facts.

STUDENT PROFILE:
${profile ? `
- Nationality: ${profile.nationality_name ?? profile.nationality ?? "Not set"}
- Education Level: ${profile.education_level ?? "Not set"}
- Intended Degree: ${profile.intended_degree ?? "Not set"}
- Intended Field: ${profile.intended_field ?? "Not set"}
- Academic Score: ${profile.academic_score != null ? `${profile.academic_score} (${profile.academic_score_type})` : "Not set"}
- English Level: ${profile.english_level ?? "Not set"}
- Preferred Countries: ${profile.preferred_countries?.join(", ") || "None set"}
- Test Scores: ${Object.entries(profile.test_scores_json ?? {}).map(([k, v]) => `${k.toUpperCase()}: ${v}`).join(", ") || "None"}
` : "No profile set. Advise the student to complete their scholarship profile."}

VERIFIED SCHOLARSHIP DATA:
${matchContext.length > 0 ? matchContext.map((s, i) => `
Scholarship ${i + 1}: ${s.name}
- Provider: ${s.provider}
- Country: ${s.country}
- Eligible Degrees: ${s.degrees}
- Fields: ${s.fields}
- Funding: ${s.funding}
- Deadline: ${s.deadline}
- Match Score: ${s.match_score}/100 (${s.match_category})
- Matching Points: ${s.strong_matches || "None"}
- Potential Issues: ${s.issues || "None"}
- Missing Info: ${s.missing || "None"}
- Disqualifying: ${s.failed || "None"}
- Official Source: ${s.official_url}
`).join("\n") : "No specific scholarships. Give general guidance only."}

You MUST respond with ONLY a valid JSON object. No text before or after. No markdown. No code fences.
Use this exact structure:
{"recommendation":"Your answer here","why_it_matches":["point 1","point 2"],"potential_issues":["issue 1"],"missing_info":["info needed 1"],"official_sources":[{"name":"Scholarship Name","url":"https://url.com"}],"disclaimer":"Always verify on official websites before applying."}`;

  try {
    const rawText = await generateText({
      systemPrompt,
      prompt: question,
      temperature: 0.1,
      maxOutputTokens: 2048,
      json: true,
    });

    const aiData = parseAdvisorJson(rawText, "", officialSources);

    return NextResponse.json({ data: aiData, error: null }, { status: 200 });

  } catch (err) {
    console.error("[AI Advisor] Error:", err);

    // Return a graceful fallback — matching scores still work without AI
    return NextResponse.json(
      {
        data: {
          recommendation:
            "I'm having trouble connecting to the AI service right now. Your match score and eligibility breakdown in the sidebar are still accurate — those are calculated directly from the scholarship requirements. Please check the official scholarship website for detailed information.",
          why_it_matches: [],
          potential_issues: [],
          missing_info: [],
          official_sources: officialSources,
          disclaimer: "Always verify all information on the official scholarship websites before applying.",
        } satisfies AIAdvisorResponse,
        error: null,
      },
      { status: 200 }
    );
  }
}
