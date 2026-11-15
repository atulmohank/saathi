import { NextResponse } from "next/server";
import { z } from "zod";
import { audit } from "@/lib/audit";
import { requirePermission } from "@/lib/auth/guard";
import { db } from "@/lib/db";
import { handleError, readJson } from "@/lib/http";
import { appointmentSchema, uuid } from "@/lib/validation";

const createBody = z.object({ elderId: uuid, appointment: appointmentSchema });
const deleteBody = z.object({ elderId: uuid, appointmentId: uuid });

// Appointments are part of the care plan: same permission as editing medicines.
export async function POST(req: Request) {
  try {
    const { elderId, appointment: a } = createBody.parse(await readJson(req));
    const { actor } = await requirePermission(elderId, "edit_medicine");
    const row = { elder_id: elderId, doctor_name: a.doctorName, specialty: a.specialty, location: a.location, starts_at: a.startsAt, notes: a.notes };
    const { data } = await db().from("appointments").insert(row).select("id").single();
    await audit({ circleId: actor.circleId, actor: actor.memberId, action: "appointment_created", entity: "appointment", entityId: data?.id, after: row });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return handleError(e);
  }
}

/** DELETE /api/appointments — remove an appointment (edit_medicine permission, audited). */
export async function DELETE(req: Request) {
  try {
    const { elderId, appointmentId } = deleteBody.parse(await readJson(req));
    const { actor } = await requirePermission(elderId, "edit_medicine");
    const { data: before } = await db().from("appointments").select("id, elder_id, doctor_name, specialty, location, starts_at, notes").eq("id", appointmentId).eq("elder_id", elderId).maybeSingle();
    if (!before) return NextResponse.json({ error: "Not found." }, { status: 404 });
    await db().from("appointments").delete().eq("id", appointmentId);
    await audit({ circleId: actor.circleId, actor: actor.memberId, action: "appointment_removed", entity: "appointment", entityId: appointmentId, before });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return handleError(e);
  }
}
