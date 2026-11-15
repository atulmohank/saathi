import { NextResponse } from "next/server";
import { z } from "zod";
import { audit } from "@/lib/audit";
import { requirePermission } from "@/lib/auth/guard";
import { applyMedicineChange } from "@/lib/changes-apply";
import { db } from "@/lib/db";
import { resolveChangeFlow } from "@/lib/engine/changes";
import type { ChangeSource } from "@/lib/engine/types";
import { handleError, readJson } from "@/lib/http";
import { medicineSchema, uuid } from "@/lib/validation";

const body = z.object({
  elderId: uuid,
  medicineId: uuid.nullable(),
  /** Create: full medicine. Edit: partial. Remove: { active: false }. */
  medicine: medicineSchema.partial().extend({ active: z.boolean().optional() }),
  doctorInstruction: z.boolean().default(false),
});

/**
 * Create / edit / remove a medicine. The engine decides whether it applies now
 * or becomes a proposal for the elder or decision partner.
 */
export async function POST(req: Request) {
  try {
    const input = body.parse(await readJson(req));
    if (!input.medicineId) medicineSchema.parse(input.medicine); // create needs every field
    if (Object.keys(input.medicine).length === 0) return NextResponse.json({ error: "Nothing to change." }, { status: 400 });

    const { actor, elder } = await requirePermission(input.elderId, "edit_medicine");
    if (input.medicineId) {
      const { data: m } = await db().from("medicines").select("id").eq("id", input.medicineId).eq("elder_id", elder.id).maybeSingle();
      if (!m) return NextResponse.json({ error: "Not found." }, { status: 404 });
    }

    const source: ChangeSource = input.doctorInstruction ? "doctor_instruction" : actor.role;
    const flow = resolveChangeFlow({ mode: elder.mode, source, actorRole: actor.role });

    if (flow === "apply_now") {
      const id = await applyMedicineChange({ circleId: actor.circleId, actorId: actor.memberId, elderId: elder.id, medicineId: input.medicineId, diff: input.medicine });
      if (source === "doctor_instruction" || actor.role !== "elder") {
        await db().from("change_proposals").insert({
          elder_id: elder.id,
          medicine_id: id,
          proposed_by: actor.memberId,
          source,
          diff: input.medicine,
          status: "applied",
          decided_by: actor.memberId,
          decided_at: new Date().toISOString(),
        });
      }
      return NextResponse.json({ ok: true, flow, medicineId: id });
    }

    const { data: p } = await db()
      .from("change_proposals")
      .insert({ elder_id: elder.id, medicine_id: input.medicineId, proposed_by: actor.memberId, source, diff: input.medicine })
      .select("id")
      .single();
    await audit({ circleId: actor.circleId, actor: actor.memberId, action: "proposal_created", entity: "change_proposal", entityId: p?.id, after: input.medicine });
    return NextResponse.json({ ok: true, flow });
  } catch (e) {
    return handleError(e);
  }
}
