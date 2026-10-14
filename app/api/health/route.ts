import { NextResponse } from "next/server";

/** Liveness endpoint: deliberately exposes no configuration or dependency details. */
export function GET() {
  return NextResponse.json({ status: "ok" }, { status: 200 });
}
