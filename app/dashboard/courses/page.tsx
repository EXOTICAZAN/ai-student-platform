import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import CoursesClient from "@/components/courses/CoursesClient";

export const metadata = { title: "Courses — EduForge AI" };
export default async function CoursesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("course_profiles").select("*").eq("user_id", user.id).maybeSingle();
  const { data: course } = await supabase.from("courses").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(1).maybeSingle();
  let modules: unknown[] = [], progress: unknown[] = [], certificate: unknown = null;
  if (course) {
    const { data: moduleRows } = await supabase.from("course_modules").select("*, course_videos(*)").eq("course_id", course.id).order("position");
    modules = moduleRows ?? [];
    const { data: progressRows } = await supabase.from("course_progress").select("video_id").eq("user_id", user.id).eq("course_id", course.id);
    progress = progressRows ?? [];
    const { data: cert } = await supabase.from("course_certificates").select("*").eq("user_id", user.id).eq("course_id", course.id).maybeSingle();
    certificate = cert;
  }
  return <CoursesClient userName={String(user.user_metadata?.full_name ?? user.email ?? "Student")} profile={profile} course={course} modules={modules} progress={progress} certificate={certificate} />;
}
