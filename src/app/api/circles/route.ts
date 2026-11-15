import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { audit } from "@/lib/audit";
import { createSession } from "@/lib/auth/session";
import { newCircleCode } from "@/lib/circle-code";
import { db } from "@/lib/db";
import type { Role } from "@/lib/engine/types";
import { handleError, readJson } from "@/lib/http";
import { createCircleSchema } from "@/lib/validation";

/** Create a real care circle: circle → elder → members (each with their own bcrypt passcode). */
export async function POST(req: Request) {
  try {
    const input = createCircleSchema.parse(await readJson(req, 32_000));

    let circle: { id: string; code: string } | null = null;
    for (let i = 0; i < 5 && !circle; i++) {
      const { data, error } = await db().from("care_circles").insert({ name: input.circleName, code: newCircleCode() }).select("id, code").single();
      if (!error) circle = data;
      else if (!/duplicate|unique/i.test(error.message)) throw new Error(error.message);
    }
    if (!circle) throw new Error("could not allocate a circle code");

    const e = input.elder;
    const { data: elder, error: eErr } = await db()
      .from("elders")
      .insert({
        circle_id: circle.id,
        display_name: e.displayName,
        age: e.age,
        autonomy_mode: e.autonomyMode,
        preferred_language: e.preferredLanguage,
        emergency_info: {
          blood_group: e.emergency.bloodGroup,
          allergies: e.emergency.allergies,
          conditions: e.emergency.conditions,
          doctor_name: e.emergency.doctorName,
          doctor_phone: e.emergency.doctorPhone,
        },
      })
      .select("id")
      .single();
    if (eErr || !elder) throw new Error(eErr?.message ?? "elder insert failed");

    const rows = await Promise.all(
      input.members.map(async (m, i) => ({
        circle_id: circle!.id,
        elder_id: m.role === "elder" ? elder.id : null,
        display_name: m.displayName,
        email: m.email || null,
        role: m.role,
        passcode_hash: await bcrypt.hash(m.passcode, 10),
        is_on_duty: m.role === "caretaker" && input.members.findIndex((x) => x.role === "caretaker") === i,
      })),
    );
    const { data: members, error: mErr } = await db().from("members").insert(rows, { defaultToNull: false }).select("id, display_name, role");
    if (mErr || !members?.length) throw new Error(mErr?.message ?? "member insert failed");

    const me = members.find((m) => m.display_name === input.members[0].displayName)!;
    await audit({ circleId: circle.id, actor: me.id, action: "circle_created", entity: "care_circle", entityId: circle.id, after: { name: input.circleName, members: members.length } });
    await createSession({ sub: me.id, cid: circle.id, role: me.role as Role, name: me.display_name, demo: false });
    return NextResponse.json({ ok: true, circleId: circle.id, code: circle.code, role: me.role });
  } catch (e) {
    return handleError(e);
  }
}
