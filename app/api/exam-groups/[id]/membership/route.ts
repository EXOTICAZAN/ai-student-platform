import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isUuid, serverError } from "@/lib/api/guard";
import { limitOrNull } from "@/lib/api/rateLimit";
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) { return changeMembership(params, "join"); }
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) { return changeMembership(params, "leave"); }
async function changeMembership(params: Promise<{ id: string }>, action: "join" | "leave") {
  const supabase = await createClient(); const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  const limited = await limitOrNull("exam_groups_membership", user.id, 60); if (limited) return limited;
  const { id } = await params; if (!isUuid(id)) return NextResponse.json({ error: "Invalid group" }, { status: 400 });
  if (action === "join") {
    const { data: group, error: groupError } = await supabase.from("exam_groups").select("id,max_members,member_count").eq("id", id).single();
    if (groupError || !group) return NextResponse.json({ error: "Group not found" }, { status: 404 });
    if (group.member_count >= group.max_members) return NextResponse.json({ error: "This group is full" }, { status: 409 });
    const { error } = await supabase.from("exam_group_members").insert({ group_id: id, user_id: user.id });
    if (error?.code === "23505") return NextResponse.json({ data: { is_member: true } });
    if (error) return serverError("POST exam group membership", error, "Could not join the group.");
  } else {
    const { error } = await supabase.from("exam_group_members").delete().eq("group_id", id).eq("user_id", user.id);
    if (error) return serverError("DELETE exam group membership", error, "Could not leave the group.");
  }
  return NextResponse.json({ data: { is_member: action === "join" } });
}
