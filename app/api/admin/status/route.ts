import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/admin/auth";
export async function GET() { const supabase = await createClient(); const { data: { session } } = await supabase.auth.getSession(); return NextResponse.json({ isAdmin: isAdminEmail(session?.user?.email) }); }
