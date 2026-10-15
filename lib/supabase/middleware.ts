import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isInvalidSessionError } from "./auth-errors";

/**
 * Refresh only on a real HTML document request. RSC navigations, API calls,
 * prefetches and assets cannot reliably propagate Set-Cookie back into the
 * browser before the next parallel request, so refreshing from them can make
 * Supabase rotate the same refresh token concurrently.
 */
export function isDocumentRequest(request: Pick<NextRequest, "method" | "nextUrl" | "headers">) {
  if (request.method !== "GET" && request.method !== "HEAD") return false;
  if (request.nextUrl.pathname.startsWith("/api/")) return false;

  const headers = request.headers;
  if (
    headers.get("rsc") === "1" ||
    headers.has("next-router-state-tree") ||
    headers.get("purpose") === "prefetch" ||
    headers.has("next-router-prefetch") ||
    headers.get("accept")?.includes("text/x-component")
  ) {
    return false;
  }

  const destination = headers.get("sec-fetch-dest");
  if (destination && destination !== "document") return false;

  return headers.get("accept")?.includes("text/html") === true || destination === "document";
}

export function shouldRefreshSession(
  request: Pick<NextRequest, "nextUrl" | "method" | "headers">,
) {
  // Public pages do not need a Supabase lookup. More importantly, a stale
  // auth cookie on / or /login must not trigger a refresh-token error before
  // the user has even started signing in.
  return request.nextUrl.pathname.startsWith("/dashboard") && isDocumentRequest(request);
}

function clearAuthCookies(response: NextResponse, request: NextRequest) {
  for (const cookie of request.cookies.getAll()) {
    if (cookie.name.startsWith("sb-")) response.cookies.delete(cookie.name);
  }
}

/**
 * Refresh Supabase at the document request boundary, where response cookies
 * can reach the browser. Non-document requests are deliberately pass-through;
 * their handlers use the session already established by this boundary.
 */
export async function updateSession(request: NextRequest) {
  const response = NextResponse.next({ request });

  if (!shouldRefreshSession(request)) return response;

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

  let user = null;
  let error: unknown = null;

  try {
    const result = await supabase.auth.getUser();
    user = result.data.user;
    error = result.error;
  } catch (caught) {
    // Some Supabase/Auth versions throw the refresh error instead of returning
    // it. Handle it at the boundary so Next.js does not print an uncaught
    // AuthApiError and the browser receives a clean login redirect.
    error = caught;
  }

  // Do not leave a spent refresh token in the browser. The next request then
  // has a clean, quiet unauthenticated result instead of retrying the token.
  if (error && isInvalidSessionError(error)) clearAuthCookies(response, request);

  if (!user) {
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
