import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { audit } from "@/lib/audit";
import { requirePermission } from "@/lib/auth/guard";
import { db } from "@/lib/db";
import { handleError, readJson } from "@/lib/http";
import { memberSchema, uuid } from "@/lib/validation";

const addBody = z.object({
  elderId: uuid,
  member: memberSchema.refine((m) => m.role !== "elder", "Elders are added when the circle is created"),
});
const dutyBody = z.object({ elderId: uuid, memberId: uuid, onDuty: z.boolean() });

/** Add a member (needs manage_members for the elder's mode). */
export async function POST(req: Request) {
  try {
    const { elderId, member } = addBody.parse(await readJson(req));
    const { actor } = await requirePermission(elderId, "manage_members");
    const { data: clash } = await db().from("members").select("id").eq("circle_id", actor.circleId).ilike("display_name", member.displayName).maybeSingle();
    if (clash) return NextResponse.json({ error: "Someone in this circle already has that name." }, { status: 409 });
    const { data, error } = await db()
      .from("members")
      .insert({
        circle_id: actor.circleId,
        display_name: member.displayName,
        email: member.email || null,
        role: member.role,
        passcode_hash: await bcrypt.hash(member.passcode, 10),
      })
      .select("id")
      .single();
    if (error || !data) throw new Error(error?.message ?? "insert failed");
    await audit({
      circleId: actor.circleId,
      actor: actor.memberId,
      action: "member_added",
      entity: "member",
      entityId: data.id,
      after: { name: member.displayName, role: member.role },
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return handleError(e);
  }
}

/** On-duty toggle. A caretaker may toggle themself; otherwise manage_members is required. */
export async function PATCH(req: Request) {
  try {
    const { elderId, memberId, onDuty } = dutyBody.parse(await readJson(req));
    const { data: target } = await db().from("members").select("id, circle_id, role, display_name, is_on_duty").eq("id", memberId).maybeSingle();
    const { requireActor } = await import("@/lib/auth/guard");
    const me = await requireActor();
    if (!target || target.circle_id !== me.circleId) return NextResponse.json({ error: "Not found." }, { status: 404 });
    if (target.role !== "caretaker") return NextResponse.json({ error: "Only caretakers go on or off duty." }, { status: 400 });
    if (me.memberId !== memberId) await requirePermission(elderId, "manage_members");
    await db().from("members").update({ is_on_duty: onDuty }).eq("id", memberId);
    await audit({
      circleId: me.circleId,
      actor: me.memberId,
      action: onDuty ? "on_duty" : "off_duty",
      entity: "member",
      entityId: memberId,
      before: { is_on_duty: target.is_on_duty },
      after: { is_on_duty: onDuty },
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return handleError(e);
  }
}
