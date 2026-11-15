import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/** Public liveness probe. Returns nothing but {ok:true}. */
export function GET() {
  return NextResponse.json({ ok: true });
}
