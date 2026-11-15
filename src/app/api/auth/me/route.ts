import { NextResponse } from "next/server";
import { requireActor } from "@/lib/auth/guard";
import { handleError } from "@/lib/http";

/** GET /api/auth/me — the signed-in member (re-read from the database). */
export async function GET() {
  try {
    const a = await requireActor();
    return NextResponse.json({ memberId: a.memberId, circleId: a.circleId, role: a.role, elderId: a.elderId, name: a.name, demo: a.demo });
  } catch (e) {
    return handleError(e);
  }
}
