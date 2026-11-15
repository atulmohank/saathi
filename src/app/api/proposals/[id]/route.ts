import { NextResponse } from "next/server";
import { z } from "zod";
import { audit } from "@/lib/audit";
import { requirePermission } from "@/lib/auth/guard";
import { applyMedicineChange, type MedicineDiff } from "@/lib/changes-apply";
import { db } from "@/lib/db";
import { handleError, readJson } from "@/lib/http";
import { medicinePatchSchema, uuid } from "@/lib/validation";

const body = z.object({ decision: z.enum(["approve", "decline"]) });

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const id = uuid.parse((await ctx.params).id);
    const { decision } = body.parse(await readJson(req));
    const { data: p } = await db().from("change_proposals").select("id, elder_id, medicine_id, proposed_by, source, diff, status, decided_by, created_at").eq("id", id).maybeSingle();
    if (!p) return NextResponse.json({ error: "Not found." }, { status: 404 });

    const { actor, elder } = await requirePermission(p.elder_id, "approve_change");
    if (p.status !== "pending") return NextResponse.json({ error: "Already decided." }, { status: 409 });

    // Claim it atomically so two approvers can't both apply it.
    const { data: claimed } = await db()
      .from("change_proposals")
      .update({ status: decision === "approve" ? "approved" : "declined", decided_by: actor.memberId, decided_at: new Date().toISOString() })
      .eq("id", id)
      .eq("status", "pending")
      .select("id");
    if (!claimed?.length) return NextResponse.json({ error: "Already decided." }, { status: 409 });

    if (decision === "approve") {
      const diff = medicinePatchSchema.parse(p.diff) as MedicineDiff;
      await applyMedicineChange({ circleId: actor.circleId, actorId: actor.memberId, elderId: elder.id, medicineId: p.medicine_id, diff });
    }
    await audit({
      circleId: actor.circleId,
      actor: actor.memberId,
      action: decision === "approve" ? "proposal_approved" : "proposal_declined",
      entity: "change_proposal",
      entityId: id,
      after: p.diff,
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return handleError(e);
  }
}
