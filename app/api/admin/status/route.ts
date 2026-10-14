import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/admin/auth";
export async function GET() { const supabase = await createClient(); const { data: { user } } = await supabase.auth.getUser(); return NextResponse.json({ isAdmin: isAdminEmail(user?.email) }); }
