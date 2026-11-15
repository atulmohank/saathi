import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { handleError, readJson } from "@/lib/http";
import { circleCodeSchema } from "@/lib/validation";

/** Step 1 of passcode sign-in: circle code → member names to choose from. */
export async function POST(req: Request) {
  try {
    const { code } = z.object({ code: circleCodeSchema }).parse(await readJson(req));
    const { data: circle } = await db().from("care_circles").select("id, name").eq("code", code).maybeSingle();
    if (!circle) return NextResponse.json({ error: "We couldn't find a circle with that code." }, { status: 404 });
    const { data: members } = await db().from("members").select("id, display_name, role").eq("circle_id", circle.id).order("created_at");
    return NextResponse.json({ circleName: circle.name, members: (members ?? []).map((m) => ({ id: m.id, name: m.display_name, role: m.role })) });
  } catch (e) {
    return handleError(e);
  }
}
