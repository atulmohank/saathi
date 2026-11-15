import { NextResponse } from "next/server";
import { secretMatches } from "@/lib/cron-auth";
import { env } from "@/lib/env";
import { handleError } from "@/lib/http";
import { runScheduler } from "@/lib/scheduler";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Called every 5 min by cron-job.org with header `x-cron-secret`. Idempotent. */
export async function POST(req: Request) {
  if (!secretMatches(req.headers.get("x-cron-secret"), env().CRON_SECRET)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const counts = await runScheduler();
    return NextResponse.json({ ok: true, at: new Date().toISOString(), ...counts });
  } catch (e) {
    return handleError(e);
  }
}
