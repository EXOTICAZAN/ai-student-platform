import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const schema = z.object({
  reference_key: z.string().max(100),
  institution_snapshot: z.string().max(300),
  status: z.enum(["planning", "applying", "submitted", "accepted", "rejected", "withdrawn"]),
});

async function currentUser() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  return { supabase, user: session?.user ?? null };
}

export async function GET() {
  const { supabase, user } = await currentUser();
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  const { data, error } = await supabase
    .from("pakistan_admission_applications")
    .select("reference_key,status,institution_snapshot,updated_at")
    .eq("user_id", user.id);
  if (error) return NextResponse.json({ error: "Applications unavailable until migration is applied." }, { status: 503 });
  return NextResponse.json({ data });
}

export async function POST(req: NextRequest) {
  const { supabase, user } = await currentUser();
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid application status" }, { status: 422 });
  const { data, error } = await supabase
    .from("pakistan_admission_applications")
    .upsert({ user_id: user.id, ...parsed.data }, { onConflict: "user_id,reference_key" })
    .select("reference_key,status")
    .single();
  if (error) return NextResponse.json({ error: "Could not save status. Apply migration 012 first." }, { status: 503 });
  return NextResponse.json({ data });
}
