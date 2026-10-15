import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { cache } from "react";
import type { User } from "@supabase/supabase-js";

export async function createClient(): Promise<SupabaseClient> {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Server Components cannot always write cookies. The proxy owns
            // response-cookie propagation; this is safe for read-only renders.
          }
        },
      },
    },
  );
}

/**
 * Read the session established by the document boundary. This intentionally
 * does not call getUser(): getUser may rotate a refresh token, and API/RSC
 * requests run in parallel and cannot safely propagate a rotated cookie.
 *
 * Security invariant: proxy.ts is the authoritative refresh/auth boundary for
 * browser navigations. It verifies the session with getUser on the HTML
 * document request and propagates the resulting cookies. API handlers only
 * read that session here and still enforce user_id/RLS authorization.
 * React cache deduplicates reads within one server render without sharing
 * mutable sessions between requests.
 */
export const getAuthContext = cache(async () => {
  const supabase = await createClient();
  const { data: { session }, error } = await supabase.auth.getSession();
  return { supabase, user: (session?.user ?? null) as User | null, error };
});
