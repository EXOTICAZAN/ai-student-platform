import { NextResponse, type NextRequest } from "next/server";

/**
 * Keep the proxy free of Supabase auth calls. Every request that needs an
 * authenticated user verifies the session with getUser() in its page, server
 * action, or route handler. Calling getSession()/getUser() here as well would
 * create a second server client and can rotate the same refresh token while a
 * protected page is being rendered.
 *
 * This proxy remains intentionally lightweight. The server-side checks are the
 * authorization boundary; the proxy must not be the only protection for any
 * route.
 */
export async function updateSession(request: NextRequest) {
  void request;
  return NextResponse.next();
}
