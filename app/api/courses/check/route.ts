import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateJson } from "@/lib/ai/groq";
import { consume, tooManyRequests } from "@/lib/api/rateLimit";
import { isUuid, serverError } from "@/lib/api/guard";
import { gradeCheck, sanitizeCheckQuestions, validateCheckQuestions, type GeneratedCheckQuestion } from "@/lib/courses/check";

const GENERIC_ERROR = "We could not process that knowledge check.";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ data: null, error: { code: "unauthorized", message: "Sign in required." } }, { status: 401 });
    const limit = await consume("course_check", user.id, 20);
    if (!limit.ok) return tooManyRequests(limit.retryAfterMs);
    const body = await request.json().catch(() => null) as Record<string, unknown> | null;
    const action = body?.action;
    const admin = createAdminClient();
    if (!admin) throw new Error("course check session store is unavailable");

    if (action === "generate") {
      const videoId = body?.videoId;
      if (!isUuid(videoId)) return NextResponse.json({ data: null, error: { code: "bad_request", message: "A valid video is required." } }, { status: 400 });
      const { data: video } = await supabase.from("course_videos").select("id,title,module_id,course_modules!inner(course_id,courses!inner(id,user_id))").eq("id", videoId).eq("course_modules.courses.user_id", user.id).single();
      if (!video) return NextResponse.json({ data: null, error: { code: "not_found", message: "Video not found." } }, { status: 404 });
      const moduleData = video.course_modules as unknown as { course_id: string; courses: { id: string; user_id: string } };
      const result = await generateJson<{ questions: GeneratedCheckQuestion[] }>({ systemPrompt: "Create exactly three concise multiple-choice knowledge-check questions. Return JSON {questions:[{question,options,answer}]}; answer must exactly match one option. Do not include explanations.", prompt: `Create a check for the lesson titled: ${String(video.title).slice(0, 160)}`, temperature: 0.2, maxOutputTokens: 1600 });
      const questions = validateCheckQuestions(result.questions);
      if (!questions.length) throw new Error("invalid questions");
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();
      const { data: session, error: sessionError } = await admin.from("course_check_sessions").insert({ user_id: user.id, course_id: moduleData.course_id, module_id: video.module_id, video_id: video.id, questions, expires_at: expiresAt }).select("id").single();
      if (sessionError || !session) throw sessionError ?? new Error("session insert failed");
      return NextResponse.json({ data: { session_id: session.id, questions: sanitizeCheckQuestions(questions) }, error: null });
    }

    if (action !== "submit" || !isUuid(body?.sessionId)) return NextResponse.json({ data: null, error: { code: "bad_request", message: "A valid check session is required." } }, { status: 400 });
    const sessionId = body.sessionId;
    const { data: session } = await admin.from("course_check_sessions").select("id,user_id,course_id,module_id,video_id,questions,expires_at,used_at").eq("id", sessionId).eq("user_id", user.id).maybeSingle();
    if (!session || session.used_at || new Date(session.expires_at).getTime() <= Date.now()) return NextResponse.json({ data: null, error: { code: "bad_request", message: "This check session is no longer valid." } }, { status: 400 });
    const { data: video } = await supabase.from("course_videos").select("id,module_id,course_modules!inner(course_id,courses!inner(id,user_id))").eq("id", session.video_id).eq("course_modules.courses.user_id", user.id).single();
    if (!video) return NextResponse.json({ data: null, error: { code: "not_found", message: "Video not found." } }, { status: 404 });
    const questions = validateCheckQuestions(session.questions);
    if (!questions.length) throw new Error("invalid stored questions");
    const grade = gradeCheck(questions, body.answers);
    if (!grade) return NextResponse.json({ data: null, error: { code: "bad_request", message: "Submit an answer for every question." } }, { status: 400 });

    const { data: claimed, error: claimError } = await admin.from("course_check_sessions").update({ used_at: new Date().toISOString() }).eq("id", session.id).eq("user_id", user.id).is("used_at", null).gt("expires_at", new Date().toISOString()).select("id").maybeSingle();
    if (claimError) throw claimError;
    if (!claimed) return NextResponse.json({ data: null, error: { code: "bad_request", message: "This check session is no longer valid." } }, { status: 400 });

    const { error: checkError } = await supabase.from("course_checks").insert({ user_id: user.id, course_id: session.course_id, module_id: session.module_id, video_id: session.video_id, questions: sanitizeCheckQuestions(questions), answers: body.answers, score: grade.score, passed: grade.passed });
    if (checkError) throw checkError;
    if (grade.passed) {
      const { error: progressError } = await supabase.from("course_progress").upsert({ user_id: user.id, course_id: session.course_id, module_id: session.module_id, video_id: session.video_id }, { onConflict: "user_id,video_id" });
      if (progressError) throw progressError;
    }

    // Read IDs rather than relying on nullable head counts. This also avoids
    // duplicate progress rows inflating completion after older deployments.
    const [{ data: videoRows, error: videosError }, { data: progressRows, error: progressReadError }] = await Promise.all([
      supabase.from("course_videos").select("id,course_modules!inner(course_id)").eq("course_modules.course_id", session.course_id),
      supabase.from("course_progress").select("video_id").eq("user_id", user.id).eq("course_id", session.course_id),
    ]);
    if (videosError || progressReadError) throw videosError ?? progressReadError;
    const videoIds = new Set((videoRows ?? []).map((row) => row.id));
    const completedIds = new Set((progressRows ?? []).map((row) => row.video_id).filter((id) => videoIds.has(id)));
    let certificate = null;
    if (grade.passed && videoIds.size > 0 && completedIds.size === videoIds.size) {
      const { data: course, error: courseError } = await supabase.from("courses").select("title").eq("id", session.course_id).eq("user_id", user.id).single();
      if (courseError || !course) throw courseError ?? new Error("course not found");
      const { data: existing, error: existingError } = await supabase.from("course_certificates").select("*").eq("user_id", user.id).eq("course_id", session.course_id).maybeSingle();
      if (existingError) throw existingError;
      if (existing) {
        certificate = existing;
      } else {
        const certificateId = `EF-${session.course_id.slice(0, 8).toUpperCase()}-${user.id.slice(0, 6).toUpperCase()}`;
        const { data: cert, error: certificateError } = await supabase.from("course_certificates").upsert({ user_id: user.id, course_id: session.course_id, certificate_id: certificateId, student_name: String(user.user_metadata?.full_name ?? user.email ?? "Student") }, { onConflict: "user_id,course_id" }).select("*").single();
        if (certificateError) throw certificateError;
        certificate = cert;
      }
    }
    return NextResponse.json({ data: { score: grade.score, passed: grade.passed, certificate, totalVideos: videoIds.size, completedVideos: completedIds.size }, error: null });
  } catch (error) {
    return serverError("/api/courses/check", error, GENERIC_ERROR);
  }
}
