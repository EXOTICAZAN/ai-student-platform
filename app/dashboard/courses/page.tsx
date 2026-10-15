import { redirect } from "next/navigation";
import { getAuthContext } from "@/lib/supabase/server";
import { selectCourse } from "@/lib/courses/selection";
import CoursesClient from "@/components/courses/CoursesClient";

export const metadata = { title: "Courses — EduForge AI" };

type SearchParams = Promise<{ courseId?: string | string[]; new?: string | string[] }>;

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function CoursesPage({ searchParams }: { searchParams: SearchParams }) {
  const { supabase, user } = await getAuthContext();
  if (!user) redirect("/login");

  const [{ data: profile }, { data: courses }] = await Promise.all([
    supabase.from("course_profiles").select("*").eq("user_id", user.id).maybeSingle(),
    // This list is explicitly scoped to the authenticated user. The same ownership is
    // also enforced by the courses RLS policy for defense in depth.
    supabase.from("courses").select("id,title,created_at").eq("user_id", user.id).order("created_at", { ascending: false }),
  ]);
  const params = await searchParams;
  const courseList = courses ?? [];
  const selectedSummary = selectCourse(courseList, firstParam(params.courseId), ["1", "true"].includes(firstParam(params.new) ?? ""));
  const { data: selectedCourse } = selectedSummary
    ? await supabase.from("courses").select("*").eq("id", selectedSummary.id).eq("user_id", user.id).maybeSingle()
    : { data: null };

  let modules: unknown[] = [];
  let progress: unknown[] = [];
  let certificate: unknown = null;
  if (selectedCourse) {
    const [{ data: moduleRows }, { data: progressRows }, { data: cert }] = await Promise.all([
      supabase.from("course_modules").select("*, course_videos(*)").eq("course_id", selectedCourse.id).order("position"),
      supabase.from("course_progress").select("video_id").eq("user_id", user.id).eq("course_id", selectedCourse.id),
      supabase.from("course_certificates").select("*").eq("user_id", user.id).eq("course_id", selectedCourse.id).maybeSingle(),
    ]);
    modules = moduleRows ?? [];
    progress = progressRows ?? [];
    certificate = cert;
  }

  return <CoursesClient userName={String(user.user_metadata?.full_name ?? user.email ?? "Student")} profile={profile} courses={courseList} course={selectedCourse} modules={modules} progress={progress} certificate={certificate} />;
}
