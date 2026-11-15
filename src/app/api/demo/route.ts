import { NextResponse } from "next/server";
import { z } from "zod";
import { fromZonedTime } from "date-fns-tz";
import { addDays } from "date-fns";
import { audit } from "@/lib/audit";
import { requireActor } from "@/lib/auth/guard";
import { createSession } from "@/lib/auth/session";
import { ensureDoses, type MedicineRow } from "@/lib/data";
import { db } from "@/lib/db";
import { seedDemo } from "@/lib/demo/seed";
import { LADDERS } from "@/lib/engine/escalation";
import { istDate } from "@/lib/engine/schedule";
import { IST, type Mode, type Role } from "@/lib/engine/types";
import { handleError, readJson } from "@/lib/http";
import { escalateDose, loadDose, runScheduler } from "@/lib/scheduler";

export const maxDuration = 60;

const body = z.object({ action: z.enum(["kamala_missed_8am", "joseph_missed_1pm", "run_scheduler", "reset"]) });

const SCENARIOS = {
  kamala_missed_8am: { elder: "Kamala", time: "08:00" },
  joseph_missed_1pm: { elder: "Joseph", time: "13:00" },
} as const;

/** Demo "time machine". Only ever works inside the fictional demo circle. */
export async function POST(req: Request) {
  try {
    const { action } = body.parse(await readJson(req));
    const actor = await requireActor();
    const { data: circle } = await db().from("care_circles").select("id, is_demo").eq("id", actor.circleId).single();
    if (!circle?.is_demo) return NextResponse.json({ error: "The time machine only works in the demo circle." }, { status: 403 });

    if (action === "reset") {
      const { circleId } = await seedDemo(db());
      const { data: me } = await db().from("members").select("id, role, display_name").eq("circle_id", circleId).eq("display_name", actor.name).single();
      if (me) await createSession({ sub: me.id, cid: circleId, role: me.role as Role, name: me.display_name, demo: true });
      return NextResponse.json({ ok: true, circleId, message: "Demo reset." });
    }

    if (action === "run_scheduler") {
      const r = await runScheduler({ circleId: circle.id });
      return NextResponse.json({
        ok: true,
        message: `Scheduler ran: ${r.dosesChecked} late doses checked, ${r.escalationEmails} escalation, ${r.upcoming} upcoming and ${r.appointmentEmails} appointment emails.`,
      });
    }

    // Simulate a missed dose: reset that dose, then replay the mode's ladder at T+each step.
    const sc = SCENARIOS[action];
    const { data: elder } = await db()
      .from("elders")
      .select("id, autonomy_mode, display_name")
      .eq("circle_id", circle.id)
      .eq("display_name", sc.elder)
      .single();
    if (!elder) return NextResponse.json({ error: "Demo elder not found. Reset the demo." }, { status: 404 });
    const { data: medsData } = await db()
      .from("medicines")
      .select("id, elder_id, name, dose_text, times, pill_look, instructions, stock_count, is_critical, active")
      .eq("elder_id", elder.id)
      .eq("active", true);
    const meds = ((medsData ?? []) as MedicineRow[]).filter((m) => m.times.includes(sc.time)).sort((a, b) => Number(b.is_critical) - Number(a.is_critical));
    const med = meds[0];
    if (!med) return NextResponse.json({ error: `No ${sc.time} medicine for ${sc.elder}.` }, { status: 404 });

    const now = new Date();
    let day = istDate(now);
    let scheduled = fromZonedTime(`${day}T${sc.time}:00`, IST);
    const ladder = LADDERS[elder.autonomy_mode as Mode];
    if (scheduled.getTime() + ladder[ladder.length - 1].afterMinutes * 60000 > now.getTime()) {
      day = istDate(addDays(now, -1)); // not late enough yet today → use yesterday's dose
      scheduled = fromZonedTime(`${day}T${sc.time}:00`, IST);
    }
    await ensureDoses([med], scheduled);
    await db()
      .from("dose_events")
      .upsert({ medicine_id: med.id, scheduled_at: scheduled.toISOString() }, { onConflict: "medicine_id,scheduled_at", ignoreDuplicates: true });
    const { data: row } = await db()
      .from("dose_events")
      .update({
        status: "pending",
        reason: null,
        marked_by: null,
        marked_at: null,
        resolved_by: null,
        escalation_level: 0,
        notified_roles: [],
        reminded_upcoming: true,
      })
      .eq("medicine_id", med.id)
      .eq("scheduled_at", scheduled.toISOString())
      .select("id")
      .single();
    if (!row) return NextResponse.json({ error: "Could not prepare the dose." }, { status: 500 });

    await audit({
      circleId: circle.id,
      actor: actor.memberId,
      action: "demo_simulated_miss",
      entity: "dose_event",
      entityId: row.id,
      after: { med: med.name, elder: sc.elder, at: scheduled.toISOString() },
    });

    let emails = 0;
    for (const step of ladder) {
      const dose = await loadDose(row.id);
      if (!dose || dose.resolved_by || dose.status !== "pending") break;
      emails += await escalateDose(dose, new Date(scheduled.getTime() + step.afterMinutes * 60000));
    }
    return NextResponse.json({
      ok: true,
      message: `${sc.elder}'s ${med.name} (${sc.time}) marked as missed. ${emails} escalation email${emails === 1 ? "" : "s"} sent, following the ${elder.autonomy_mode} ladder.`,
    });
  } catch (e) {
    return handleError(e);
  }
}
