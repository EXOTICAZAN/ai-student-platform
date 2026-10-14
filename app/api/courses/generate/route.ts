import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateJson } from "@/lib/ai/groq";
import { consume, tooManyRequests } from "@/lib/api/rateLimit";
import { normalizeGeneratedCourse } from "@/lib/courses/types";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ data: null, error: { code: "unauthorized", message: "Sign in required." } }, { status: 401 });
    const limit = await consume("course_generate", user.id, 5);
    if (!limit.ok) return tooManyRequests(limit.retryAfterMs);
    const body = await request.json().catch(() => null) as Record<string, unknown> | null;
    const interests = Array.isArray(body?.interests) ? body?.interests.filter((v): v is string => typeof v === "string").map(v => v.trim().slice(0, 80)).filter(Boolean).slice(0, 10) : [];
    const goal = typeof body?.goal === "string" ? body.goal.trim().slice(0, 500) : "";
    const skillLevel = typeof body?.skillLevel === "string" ? body.skillLevel : "beginner";
    const weeklyTime = Number(body?.weeklyTime);
    const format = typeof body?.format === "string" ? body.format : "mixed";
    if (!interests.length || !goal || !["beginner", "intermediate", "advanced"].includes(skillLevel) || !Number.isInteger(weeklyTime) || weeklyTime < 1 || weeklyTime > 168 || !["video", "reading", "mixed"].includes(format)) return NextResponse.json({ data: null, error: { code: "bad_request", message: "Complete all learning preferences." } }, { status: 400 });
    const { error: profileError } = await supabase.from("course_profiles").upsert({ user_id: user.id, interests, goal, skill_level: skillLevel, weekly_time: weeklyTime, preferred_format: format, updated_at: new Date().toISOString() });
    if (profileError) throw profileError;
    const topic = interests.join(", ");
    const raw = await generateJson({ systemPrompt: "You design practical courses. Return only JSON with title, description, skill_level, estimated_duration, and modules. modules is an array of title, description, and videos. Each video has title, url, duration. Video URLs must be either safe youtube.com/watch?v=... URLs you are confident exist or youtube.com/results?search_query=... URLs; prefer search URLs when unsure. Create 3-6 modules and 2-4 videos per module.", prompt: JSON.stringify({ interests, goal, skill_level: skillLevel, weekly_time: weeklyTime, format }), temperature: 0.3, maxOutputTokens: 6000 });
    const course = normalizeGeneratedCourse(raw, topic);
    const { data: created, error } = await supabase.from("courses").insert({ user_id: user.id, profile_user_id: user.id, title: course.title, description: course.description, skill_level: course.skill_level, estimated_duration: course.estimated_duration }).select("id").single();
    if (error || !created) throw error ?? new Error("course insert failed");
    for (const [moduleIndex, module] of course.modules.entries()) {
      const { data: createdModule, error: moduleError } = await supabase.from("course_modules").insert({ course_id: created.id, position: moduleIndex, title: module.title, description: module.description }).select("id").single();
      if (moduleError || !createdModule) throw moduleError ?? new Error("module insert failed");
      if (module.videos.length) {
        const { error: videoError } = await supabase.from("course_videos").insert(module.videos.map((video, position) => ({ module_id: createdModule.id, position, title: video.title, url: video.url, duration: video.duration ?? null })));
        if (videoError) throw videoError;
      }
    }
    return NextResponse.json({ data: { id: created.id }, error: null });
  } catch (error) {
    console.error("/api/courses/generate:", error);
    return NextResponse.json({ data: null, error: { code: "server_error", message: "We could not create your course right now." } }, { status: 500 });
  }
}
