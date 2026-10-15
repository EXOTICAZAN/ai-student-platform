import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createGroupSchema, EXAM_CATALOGUE } from "@/lib/exam-groups";
import { limitOrNull } from "@/lib/api/rateLimit";
import { readJson, serverError } from "@/lib/api/guard";

async function auth() { const supabase = await createClient(); const { data: { user } } = await supabase.auth.getUser(); return { supabase, user: user ?? null }; }
export async function GET(req: NextRequest) {
  const { supabase, user } = await auth();
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  const limited = await limitOrNull("exam_groups_read", user.id, 120); if (limited) return limited;
  const key = req.nextUrl.searchParams.get("exam_key");
  const search = req.nextUrl.searchParams.get("search")?.trim();
  if (key && !EXAM_CATALOGUE.some((exam) => exam.key === key)) return NextResponse.json({ error: "Invalid exam category" }, { status: 422 });
  let query = supabase.from("exam_groups").select("id,exam_key,exam_name,title,description,province,city,created_by,max_members,member_count,created_at").order("created_at", { ascending: false }).limit(100);
  if (key) query = query.eq("exam_key", key);
  if (search) query = query.or(`title.ilike.%${search.replace(/[%_,]/g, " ")}%,description.ilike.%${search.replace(/[%_,]/g, " ")}%`);
  const { data, error } = await query;
  if (error) return serverError("GET /api/exam-groups", error, "Groups are temporarily unavailable.");
  const groupIds = (data ?? []).map((group) => group.id);
  const { data: memberships } = groupIds.length ? await supabase.from("exam_group_members").select("group_id").eq("user_id", user.id).in("group_id", groupIds) : { data: [] };
  const joined = new Set((memberships ?? []).map((membership) => membership.group_id));
  return NextResponse.json({ data: (data ?? []).map((group) => ({ ...group, is_member: joined.has(group.id), is_owner: group.created_by === user.id })) });
}
export async function POST(req: NextRequest) {
  const { supabase, user } = await auth();
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  const limited = await limitOrNull("exam_groups_write", user.id, 30); if (limited) return limited;
  const parsed = createGroupSchema.safeParse(await readJson<unknown>(req));
  if (!parsed.success) return NextResponse.json({ error: "Invalid group details" }, { status: 422 });
  const values = { ...parsed.data, description: parsed.data.description || "", province: parsed.data.province || null, city: parsed.data.city || null, created_by: user.id };
  const { data: group, error } = await supabase.from("exam_groups").insert(values).select("id,exam_key,exam_name,title,description,province,city,created_by,max_members,member_count,created_at").single();
  if (error || !group) return serverError("POST /api/exam-groups", error, "Could not create the group.");
  const { error: memberError } = await supabase.from("exam_group_members").insert({ group_id: group.id, user_id: user.id });
  if (memberError) return serverError("POST /api/exam-groups membership", memberError, "Could not finish creating the group.");
  return NextResponse.json({ data: { ...group, member_count: 1, is_member: true, is_owner: true } }, { status: 201 });
}
