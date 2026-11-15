import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { handleError, readJson } from "@/lib/http";
import { circleCodeSchema } from "@/lib/validation";
import { clientKey, hit, type HitStore } from "@/lib/rate-limit";

/** Per-IP cap on circle-code lookups (stops code enumeration): 30 per 15 minutes. */
const perIp: HitStore = new Map();

/** Step 1 of passcode sign-in: circle code → member names to choose from. */
export async function POST(req: Request) {
  try {
    const r = hit(perIp, clientKey(req), 30, 15 * 60_000, Date.now());
    if (!r.allowed) return NextResponse.json({ error: "Too many tries from here. Please wait and try again." }, { status: 429, headers: { "retry-after": String(r.retryAfterSec) } });
    const { code } = z.object({ code: circleCodeSchema }).parse(await readJson(req));
    const { data: circle } = await db().from("care_circles").select("id, name").eq("code", code).maybeSingle();
    if (!circle) return NextResponse.json({ error: "We couldn't find a circle with that code." }, { status: 404 });
    const { data: members } = await db().from("members").select("id, display_name, role").eq("circle_id", circle.id).order("created_at");
    return NextResponse.json({ circleName: circle.name, members: (members ?? []).map((m) => ({ id: m.id, name: m.display_name, role: m.role })) });
  } catch (e) {
    return handleError(e);
  }
}
