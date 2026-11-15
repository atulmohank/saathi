import "server-only";
import { audit } from "./audit";
import { db } from "./db";
import type { MedicineInput } from "./validation";

export type MedicineDiff = Partial<MedicineInput> & { active?: boolean };

export function toColumns(d: MedicineDiff) {
  const c: Record<string, unknown> = {};
  if (d.name !== undefined) c.name = d.name;
  if (d.doseText !== undefined) c.dose_text = d.doseText;
  if (d.times !== undefined) c.times = d.times;
  if (d.pillLook !== undefined) c.pill_look = d.pillLook;
  if (d.instructions !== undefined) c.instructions = d.instructions;
  if (d.stockCount !== undefined) c.stock_count = d.stockCount;
  if (d.isCritical !== undefined) c.is_critical = d.isCritical;
  if (d.active !== undefined) c.active = d.active;
  return c;
}

/** Apply a medicine change (create when medicineId is null). Always audited. */
export async function applyMedicineChange(args: {
  circleId: string;
  actorId: string | null;
  elderId: string;
  medicineId: string | null;
  diff: MedicineDiff;
}): Promise<string> {
  const cols = toColumns(args.diff);
  if (!args.medicineId) {
    const { data, error } = await db()
      .from("medicines")
      .insert({ elder_id: args.elderId, ...cols })
      .select("id")
      .single();
    if (error || !data) throw new Error(error?.message ?? "insert failed");
    await audit({ circleId: args.circleId, actor: args.actorId, action: "medicine_created", entity: "medicine", entityId: data.id, after: cols });
    return data.id;
  }
  const { data: before } = await db().from("medicines").select("*").eq("id", args.medicineId).eq("elder_id", args.elderId).single();
  if (!before) throw new Error("medicine not found");
  await db()
    .from("medicines")
    .update({ ...cols, updated_at: new Date().toISOString() })
    .eq("id", args.medicineId);
  // Future pending doses must follow new times: drop pending ones from now on; they are re-created lazily.
  if (cols.times || cols.active === false) {
    await db().from("dose_events").delete().eq("medicine_id", args.medicineId).eq("status", "pending").gt("scheduled_at", new Date().toISOString());
  }
  const pick = Object.fromEntries(Object.keys(cols).map((k) => [k, (before as Record<string, unknown>)[k]]));
  await audit({
    circleId: args.circleId,
    actor: args.actorId,
    action: cols.active === false ? "medicine_removed" : "medicine_updated",
    entity: "medicine",
    entityId: args.medicineId,
    before: pick,
    after: cols,
  });
  return args.medicineId;
}
