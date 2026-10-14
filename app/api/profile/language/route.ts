import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ language: "English" }, { status: 401 });
  const { data } = await supabase.from("profiles").select("preferred_language").eq("id", user.id).maybeSingle();
  return NextResponse.json({ language: data?.preferred_language ?? "English" });
}
