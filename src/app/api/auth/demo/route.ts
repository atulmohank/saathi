import { NextResponse } from "next/server";
import { createSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { DEMO_PERSONAS } from "@/lib/demo/personas";
import type { Role } from "@/lib/engine/types";
import { handleError, readJson } from "@/lib/http";
import { demoLoginSchema } from "@/lib/validation";

/** One-click "Try the demo as…" — only ever signs into the fictional demo circle. */
export async function POST(req: Request) {
  try {
    const { persona } = demoLoginSchema.parse(await readJson(req));
    const { data: circle } = await db().from("care_circles").select("id").eq("is_demo", true).limit(1).maybeSingle();
    if (!circle) return NextResponse.json({ error: "Demo is not set up yet." }, { status: 503 });

    const { data: m } = await db()
      .from("members")
      .select("id, circle_id, role, display_name, elder_id")
      .eq("circle_id", circle.id)
      .eq("display_name", DEMO_PERSONAS[persona].displayName)
      .maybeSingle();
    if (!m) return NextResponse.json({ error: "Demo is not set up yet." }, { status: 503 });

    await createSession({ sub: m.id, cid: m.circle_id, role: m.role as Role, name: m.display_name, demo: true });
    return NextResponse.json({ ok: true, circleId: m.circle_id, role: m.role, elderId: m.elder_id });
  } catch (e) {
    return handleError(e);
  }
}
