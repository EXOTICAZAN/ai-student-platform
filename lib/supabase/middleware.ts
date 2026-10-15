import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isInvalidSessionError } from "./auth-errors";

/**
 * Refresh the Supabase session once at the request boundary. Supabase SSR
 * requires the refreshed cookies to be copied to both the request (for the
 * current render) and the response (for the browser's next request).
 */
export async function updateSession(request: NextRequest) {
  const response = NextResponse.next({ request });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            response.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  const { data: { user }, error } = await supabase.auth.getUser();

  // A rotated/expired refresh token must not be retried on every RSC request.
  // The browser client will see the cleared cookies and can return to login.
  if (error && isInvalidSessionError(error)) {
    for (const cookie of request.cookies.getAll()) {
      if (cookie.name.startsWith("sb-")) response.cookies.delete(cookie.name);
    }
  }

  // Do this at the boundary as well as in the layout so an unauthenticated
  // dashboard request never renders protected content. API requests are left
  // to their handlers so they return JSON 401s rather than HTML redirects.
  if (!user && request.nextUrl.pathname.startsWith("/dashboard")) {
    const login = request.nextUrl.clone();
    login.pathname = "/login";
    login.search = `?next=${encodeURIComponent(
      `${request.nextUrl.pathname}${request.nextUrl.search}`,
    )}`;
    const redirectResponse = NextResponse.redirect(login);
    response.cookies.getAll().forEach(({ name, value, ...options }) => {
      redirectResponse.cookies.set(name, value, options);
    });
    return redirectResponse;
  }

  return response;
}
