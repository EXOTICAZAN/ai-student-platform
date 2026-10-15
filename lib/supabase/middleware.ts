import { NextResponse, type NextRequest } from "next/server";

/**
 * Authentication is verified by the server pages, actions, and API routes.
 * Keep the proxy free of Supabase auth calls: the proxy runs for every page,
 * RSC, and API request, and an auth lookup here would duplicate the session
 * work and amplify Auth rate limits during development.
 */
export async function updateSession(request: NextRequest) {
  void request;
  return NextResponse.next();
}
