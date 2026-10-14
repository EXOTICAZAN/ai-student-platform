import "server-only";
import { createClient } from "@/lib/supabase/server";
export { isAdminEmail } from "./validation";
export function configuredAdminEmails() { return (process.env.ADMIN_EMAILS ?? "").split(",").map(x => x.trim().toLowerCase()).filter(Boolean); }
export async function getAdminUser() { const supabase = await createClient(); const { data: { user } } = await supabase.auth.getUser(); if (!user?.email || !configuredAdminEmails().includes(user.email.toLowerCase())) return { supabase, user: null }; return { supabase, user }; }

