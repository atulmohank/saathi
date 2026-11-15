import "server-only";
import type { ActionClaims } from "./auth/jwt";
import { authorize } from "./auth/access";
import { audit } from "./audit";
import { applyMedicineChange, type MedicineDiff } from "./changes-apply";
import { db } from "./db";
import { checkDoubleDose } from "./engine/doseGuard";
import type { Mode, Role } from "./engine/types";
import { medicinePatchSchema } from "./validation";

export type ActionOutcome = "taken" | "handled" | "approved" | "already" | "denied" | "invalid";

/** Applies a redeemed email action. Re-checks membership + permission server-side. */
export async function applyAction(c: ActionClaims, now = new Date()): Promise<ActionOutcome> {
  const { data: m } = await db().from("members").select("id, circle_id, role, elder_id, display_name").eq("id", c.member_id).maybeSingle();
  if (!m) return "denied";
  const actor = { memberId: m.id, circleId: m.circle_id, role: m.role as Role, elderId: m.elder_id };

  if (c.purpose === "approve_change") {
    const { data: p } = await db()
      .from("change_proposals")
      .select("id, elder_id, medicine_id, proposed_by, source, diff, status, decided_by, created_at")
      .eq("id", c.ref_id)
      .maybeSingle();
    if (!p) return "invalid";
    const { data: e } = await db().from("elders").select("id, circle_id, autonomy_mode").eq("id", p.elder_id).single();
    if (!authorize(actor, { id: e!.id, circleId: e!.circle_id, mode: e!.autonomy_mode as Mode }, "approve_change").allowed) return "denied";
    const { data: claimed } = await db()
      .from("change_proposals")
      .update({ status: "approved", decided_by: m.id, decided_at: now.toISOString() })
      .eq("id", p.id)
      .eq("status", "pending")
      .select("id");
    if (!claimed?.length) return "already";
    const diff = medicinePatchSchema.parse(p.diff) as MedicineDiff;
    await applyMedicineChange({ circleId: m.circle_id, actorId: m.id, elderId: p.elder_id, medicineId: p.medicine_id, diff });
    await audit({ circleId: m.circle_id, actor: m.id, action: "proposal_approved", entity: "change_proposal", entityId: p.id, after: { via: "email" } });
    return "approved";
  }

  const { data: d } = await db()
    .from("dose_events")
    .select("id, medicine_id, scheduled_at, status, marked_at, resolved_by, medicines!inner(elder_id, stock_count, elders!inner(id, circle_id, autonomy_mode))")
    .eq("id", c.ref_id)
    .maybeSingle();
  if (!d) return "invalid";
  const med = d.medicines as unknown as { elder_id: string; stock_count: number; elders: { id: string; circle_id: string; autonomy_mode: Mode } };
  const target = { id: med.elders.id, circleId: med.elders.circle_id, mode: med.elders.autonomy_mode };

  if (c.purpose === "handled") {
    if (!authorize(actor, target, "view").allowed) return "denied";
    const { data: claimed } = await db().from("dose_events").update({ resolved_by: m.id }).eq("id", d.id).is("resolved_by", null).select("id");
    if (!claimed?.length) return "already";
    await audit({ circleId: m.circle_id, actor: m.id, action: "dose_handled", entity: "dose_event", entityId: d.id, after: { via: "email" } });
    return "handled";
  }

  // dose_taken
  if (!authorize(actor, target, "mark_dose").allowed) return "denied";
  if (d.status === "taken") return "already";
  const guard = checkDoubleDose(
    [{ id: d.id, medicineId: d.medicine_id, scheduledAt: new Date(d.scheduled_at), status: d.status, markedAt: null, markedByName: null }],
    d.id,
    now,
  );
  if (guard.blocked) return "already";
  const { data: claimed } = await db()
    .from("dose_events")
    .update({ status: "taken", marked_by: m.id, marked_at: now.toISOString(), resolved_by: d.resolved_by ?? m.id })
    .eq("id", d.id)
    .neq("status", "taken")
    .select("id");
  if (!claimed?.length) return "already";
  if (med.stock_count > 0)
    await db()
      .from("medicines")
      .update({ stock_count: med.stock_count - 1 })
      .eq("id", d.medicine_id);
  await audit({ circleId: m.circle_id, actor: m.id, action: "dose_taken", entity: "dose_event", entityId: d.id, after: { via: "email" } });
  return "taken";
}
