import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { postSchema } from "@/lib/exam-groups";
import { isUuid, readJson, serverError } from "@/lib/api/guard";
import { limitOrNull } from "@/lib/api/rateLimit";
async function context(id: string) { const supabase = await createClient(); const { data: { session } } = await supabase.auth.getSession(); return { supabase, user: session?.user ?? null, valid: isUuid(id) }; }
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; const { supabase, user, valid } = await context(id);
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 }); if (!valid) return NextResponse.json({ error: "Invalid group" }, { status: 400 });
  const limited = await limitOrNull("exam_group_posts_read", user.id, 120); if (limited) return limited;
  const { data, error } = await supabase.from("exam_group_posts").select("id,group_id,author_id,body,resource_url,created_at").eq("group_id", id).order("created_at", { ascending: false }).limit(100);
  if (error) return serverError("GET exam group posts", error, "Discussion is temporarily unavailable."); return NextResponse.json({ data: data ?? [] });
}
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; const { supabase, user, valid } = await context(id);
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 }); if (!valid) return NextResponse.json({ error: "Invalid group" }, { status: 400 });
  const limited = await limitOrNull("exam_group_posts_write", user.id, 60); if (limited) return limited;
  const parsed = postSchema.safeParse(await readJson<unknown>(req)); if (!parsed.success) return NextResponse.json({ error: "Invalid post details" }, { status: 422 });
  const { data, error } = await supabase.from("exam_group_posts").insert({ group_id: id, author_id: user.id, body: parsed.data.body, resource_url: parsed.data.resource_url || null }).select("id,group_id,author_id,body,resource_url,created_at").single();
  if (error || !data) return serverError("POST exam group post", error, "Could not publish your post."); return NextResponse.json({ data }, { status: 201 });
}
