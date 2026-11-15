import { NextResponse } from "next/server";
import { audit } from "@/lib/audit";
import { requirePermission } from "@/lib/auth/guard";
import { db } from "@/lib/db";
import { checkDoubleDose } from "@/lib/engine/doseGuard";
import { nextEscalationStep } from "@/lib/engine/escalation";
import type { MissReason } from "@/lib/engine/types";
import { handleError, readJson } from "@/lib/http";
import { markDoseSchema } from "@/lib/validation";

/** POST /api/doses/mark — mark a dose taken or skipped with a reason. mark_dose permission, double-dose guard, reason follow-ups, audited. */
export async function POST(req: Request) {
  try {
    const input = markDoseSchema.parse(await readJson(req));
    const { data: dose } = await db()
      .from("dose_events")
      .select("id, medicine_id, scheduled_at, status, reason, marked_by, marked_at, medicines(id, elder_id, name, is_critical, stock_count)")
      .eq("id", input.doseEventId)
      .maybeSingle();
    if (!dose) return NextResponse.json({ error: "Not found." }, { status: 404 });
    const med = dose.medicines as unknown as { id: string; elder_id: string; name: string; is_critical: boolean; stock_count: number };

    const { actor, elder } = await requirePermission(med.elder_id, "mark_dose");
    const now = new Date();

    if (input.status === "taken") {
      // Guard against double dosing: look at this medicine's doses around now.
      const { data: around } = await db()
        .from("dose_events")
        .select("id, medicine_id, scheduled_at, status, marked_at, marked_by, members:marked_by(display_name)")
        .eq("medicine_id", med.id)
        .gte("scheduled_at", new Date(now.getTime() - 36 * 3600_000).toISOString())
        .lte("scheduled_at", new Date(now.getTime() + 36 * 3600_000).toISOString());
      const logs = (around ?? []).map((d) => ({
        id: d.id,
        medicineId: d.medicine_id,
        scheduledAt: new Date(d.scheduled_at),
        status: d.status,
        markedAt: d.marked_at ? new Date(d.marked_at) : null,
        markedByName: (d.members as unknown as { display_name: string } | null)?.display_name ?? null,
      }));
      const guard = checkDoubleDose(logs, dose.id, now);
      if (guard.blocked) return NextResponse.json({ error: guard.message, blocked: true }, { status: 409 });
    } else if (dose.status === "taken") {
      return NextResponse.json({ error: "This dose is already marked as taken." }, { status: 409 });
    }

    const update = {
      status: input.status,
      reason: input.status === "skipped" ? input.reason : null,
      marked_by: actor.memberId,
      marked_at: now.toISOString(),
      resolved_by: actor.memberId,
    };
    await db().from("dose_events").update(update).eq("id", dose.id);
    if (input.status === "taken" && med.stock_count > 0) {
      await db()
        .from("medicines")
        .update({ stock_count: med.stock_count - 1 })
        .eq("id", med.id);
    }

    // Reason-aware follow-ups from the engine.
    let note: string | null = null;
    if (input.status === "skipped") {
      const step = nextEscalationStep({
        mode: elder.mode,
        minutesLate: Math.max(0, (now.getTime() - new Date(dose.scheduled_at).getTime()) / 60000),
        reason: input.reason as MissReason | null,
        isCritical: med.is_critical,
        alreadyNotified: [],
        resolved: false,
      });
      if (step.followUps.includes("create_refill_task")) {
        const { data: onDuty } = await db().from("members").select("id").eq("circle_id", actor.circleId).eq("is_on_duty", true).limit(1).maybeSingle();
        await db()
          .from("tasks")
          .insert({ circle_id: actor.circleId, kind: "refill", title: `Refill ${med.name}`, assigned_to: onDuty?.id ?? null });
        note = "A refill task was created.";
      }
      if (step.notify.length) note = `${note ? note + " " : ""}The caretaker will get a gentle note.`;
    }

    await audit({
      circleId: actor.circleId,
      actor: actor.memberId,
      action: input.status === "taken" ? "dose_taken" : "dose_skipped",
      entity: "dose_event",
      entityId: dose.id,
      before: { status: dose.status },
      after: update,
    });
    return NextResponse.json({ ok: true, note });
  } catch (e) {
    return handleError(e);
  }
}
