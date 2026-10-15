import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { safeRedirectPath } from "@/lib/auth/redirect";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = safeRedirectPath(url.searchParams.get("next"));
  const login = new URL("/login", url.origin);
  login.searchParams.set("error", "auth");

  if (!code) return NextResponse.redirect(login);

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const destination = new URL(next, url.origin);
      return NextResponse.redirect(destination);
    }
  } catch {
    // Never expose provider errors, authorization codes, or token material.
  }

  return NextResponse.redirect(login);
}
