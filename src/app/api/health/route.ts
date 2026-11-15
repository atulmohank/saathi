import { NextResponse } from "next/server";
import { appBaseUrl } from "@/lib/env";

export const dynamic = "force-dynamic";

/** Public, non-secret deploy info: which commit is live and which host email links use. */
export async function GET() {
  let linkHost = "unset";
  try {
    linkHost = new URL(appBaseUrl()).host;
  } catch {}
  return NextResponse.json({ ok: true, commit: (process.env.VERCEL_GIT_COMMIT_SHA ?? "local").slice(0, 7), linkHost });
}
