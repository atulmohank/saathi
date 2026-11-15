import "server-only";
import { addDays } from "date-fns";
import { db } from "./db";
import { expandSchedule, istDate, slotOf, type Slot } from "./engine/schedule";
import type { DoseStatus, Mode, Role } from "./engine/types";
import { adherenceRate } from "./engine/adherence";
import { forecastRefill } from "./engine/stock";
import { formatInTimeZone } from "date-fns-tz";
import { IST } from "./engine/types";

export interface ElderRow {
  id: string;
  circle_id: string;
  display_name: string;
  age: number | null;
  autonomy_mode: Mode;
  preferred_language: string;
  emergency_info: Record<string, unknown>;
}
export interface MemberRow {
  id: string;
  display_name: string;
  role: Role;
  elder_id: string | null;
  is_on_duty: boolean;
}
export interface MedicineRow {
  id: string;
  elder_id: string;
  name: string;
  dose_text: string;
  times: string[];
  pill_look: string;
  instructions: string;
  stock_count: number;
  is_critical: boolean;
  active: boolean;
}
export interface DoseRow {
  id: string;
  medicine_id: string;
  scheduled_at: string;
  status: DoseStatus;
  reason: string | null;
  marked_by: string | null;
  marked_at: string | null;
  escalation_level: number;
}

/** A pending dose this many minutes past due is shown as missed. */
export const SHOW_MISSED_AFTER_MIN = 60;

/** Circle, its elders and members (server-only, explicit columns). */
export async function getCircle(circleId: string) {
  const [{ data: circle }, { data: elders }, { data: members }] = await Promise.all([
    db().from("care_circles").select("id, name, is_demo, code").eq("id", circleId).maybeSingle(),
    db()
      .from("elders")
      .select("id, circle_id, display_name, age, autonomy_mode, preferred_language, emergency_info")
      .eq("circle_id", circleId)
      .order("created_at"),
    db().from("members").select("id, display_name, role, elder_id, is_on_duty").eq("circle_id", circleId).order("created_at"),
  ]);
  return {
    circle: circle as { id: string; name: string; is_demo: boolean; code: string | null } | null,
    elders: (elders ?? []) as ElderRow[],
    members: (members ?? []) as MemberRow[],
  };
}

/** Materialise dose_events for active medicines (idempotent thanks to the unique constraint). */
export async function ensureDoses(meds: MedicineRow[], now = new Date()) {
  const active = meds.filter((m) => m.active);
  if (!active.length) return;
  const rows = expandSchedule(active, istDate(now), istDate(addDays(now, 1))).map((d) => ({
    medicine_id: d.medicineId,
    scheduled_at: d.scheduledAt.toISOString(),
  }));
  if (rows.length) await db().from("dose_events").upsert(rows, { onConflict: "medicine_id,scheduled_at", ignoreDuplicates: true });
}

export type DisplayStatus = "taken" | "skipped" | "missed" | "upcoming" | "due";

/** How a dose is shown: taken/skipped/missed, or due/upcoming; a pending dose over 60 min late shows as missed. */
export function displayStatus(d: DoseRow, now: Date): DisplayStatus {
  if (d.status === "taken" || d.status === "skipped" || d.status === "missed") return d.status;
  const late = (now.getTime() - new Date(d.scheduled_at).getTime()) / 60000;
  if (late > SHOW_MISSED_AFTER_MIN) return "missed";
  if (late >= -30) return "due";
  return "upcoming";
}

/** Everything one elder's screens need, loaded in parallel: medicines (materialising doses), today, 7-day pillbox, adherence, refills, appointments, proposals, tasks, recent changes. */
export async function getElderCare(elder: ElderRow, members: MemberRow[], now = new Date()) {
  const { data: medsData } = await db()
    .from("medicines")
    .select("id, elder_id, name, dose_text, times, pill_look, instructions, stock_count, is_critical, active")
    .eq("elder_id", elder.id)
    .order("created_at");
  const meds = (medsData ?? []) as MedicineRow[];
  await ensureDoses(meds, now);

  const weekStart = addDays(new Date(`${istDate(now)}T00:00:00+05:30`), -6);
  const ids = meds.map((m) => m.id);
  const [dosesRes, apptRes, propRes, taskRes, auditRes] = await Promise.all([
    ids.length
      ? db()
          .from("dose_events")
          .select("id, medicine_id, scheduled_at, status, reason, marked_by, marked_at, escalation_level")
          .in("medicine_id", ids)
          .gte("scheduled_at", weekStart.toISOString())
          .lt("scheduled_at", addDays(now, 2).toISOString())
          .order("scheduled_at")
      : Promise.resolve({ data: [] }),
    db()
      .from("appointments")
      .select("id, doctor_name, specialty, location, starts_at, notes")
      .eq("elder_id", elder.id)
      .gte("starts_at", addDays(now, -1).toISOString())
      .order("starts_at"),
    db()
      .from("change_proposals")
      .select("id, elder_id, medicine_id, proposed_by, source, diff, status, decided_by, created_at")
      .eq("elder_id", elder.id)
      .order("created_at", { ascending: false })
      .limit(20),
    db()
      .from("tasks")
      .select("id, kind, title, assigned_to, done")
      .eq("circle_id", elder.circle_id)
      .eq("done", false)
      .order("created_at", { ascending: false }),
    db()
      .from("audit_log")
      .select("id, action, entity, entity_id, before, after, actor, created_at")
      .eq("circle_id", elder.circle_id)
      .in("action", ["medicine_created", "medicine_updated", "medicine_removed", "proposal_approved"])
      .gte("created_at", addDays(now, -1).toISOString())
      .order("created_at", { ascending: false })
      .limit(10),
  ]);
  const doses = (dosesRes.data ?? []) as DoseRow[];
  const name = (id: string | null) => members.find((m) => m.id === id)?.display_name ?? null;
  const medById = new Map(meds.map((m) => [m.id, m]));

  const today = istDate(now);
  const todayDoses = doses
    .filter((d) => istDate(new Date(d.scheduled_at)) === today)
    .map((d) => ({ ...d, medicine: medById.get(d.medicine_id)!, display: displayStatus(d, now), markedByName: name(d.marked_by) }))
    .filter((d) => d.medicine);

  // 7-day pillbox: days × slots
  const days = Array.from({ length: 7 }, (_, i) => istDate(addDays(weekStart, i)));
  const pillbox = days.map((day) => ({
    day,
    label: formatInTimeZone(new Date(`${day}T12:00:00+05:30`), IST, "EEE d"),
    short: formatInTimeZone(new Date(`${day}T12:00:00+05:30`), IST, "EEEEE d"),
    slots: (["morning", "noon", "night"] as Slot[]).map((slot) => {
      const ds = doses
        .filter((d) => istDate(new Date(d.scheduled_at)) === day && slotOf(formatInTimeZone(new Date(d.scheduled_at), IST, "HH:mm")) === slot)
        .map((d) => ({ ...d, display: displayStatus(d, now), medName: medById.get(d.medicine_id)?.name ?? "?" }));
      return { slot, doses: ds };
    }),
  }));

  const adherence = adherenceRate(
    doses
      .filter((d) => new Date(d.scheduled_at) <= now)
      .map((d) => ({
        scheduledAt: new Date(d.scheduled_at),
        status: displayStatus(d, now) === "missed" ? ("missed" as const) : d.status,
        reason: d.reason,
      })),
    { from: weekStart, to: now },
  );

  const refills = meds.filter((m) => m.active).map((m) => ({ med: m, ...forecastRefill(m.stock_count, m.times.length) }));

  type Proposal = {
    id: string;
    medicine_id: string | null;
    proposed_by: string | null;
    source: string;
    diff: Record<string, unknown>;
    status: string;
    decided_by: string | null;
    created_at: string;
  };
  const proposals = ((propRes.data ?? []) as Proposal[]).map((p) => ({
    ...p,
    proposerName: name(p.proposed_by),
    medName: p.medicine_id ? (medById.get(p.medicine_id)?.name ?? "a medicine") : "a new medicine",
    medicine: p.medicine_id ? (medById.get(p.medicine_id) ?? null) : null,
  }));

  type Change = {
    id: string;
    action: string;
    entity_id: string | null;
    before: Record<string, unknown> | null;
    after: Record<string, unknown> | null;
    actor: string | null;
    created_at: string;
  };
  const recentChanges = ((auditRes.data ?? []) as Change[])
    .filter((c) => !c.entity_id || medById.has(c.entity_id))
    .map((c) => ({ ...c, actorName: name(c.actor), medName: c.entity_id ? (medById.get(c.entity_id)?.name ?? "") : "" }));

  return {
    meds,
    todayDoses,
    pillbox,
    adherence,
    refills,
    appointments: (apptRes.data ?? []) as {
      id: string;
      doctor_name: string;
      specialty: string;
      location: string;
      starts_at: string;
      notes: string;
    }[],
    proposals,
    tasks: (taskRes.data ?? []) as { id: string; kind: string; title: string; assigned_to: string | null; done: boolean }[],
    recentChanges,
    memberName: name,
  };
}

export const fmtTime = (iso: string) => formatInTimeZone(new Date(iso), IST, "h:mm a");
export const fmtDateTime = (iso: string) => formatInTimeZone(new Date(iso), IST, "EEE d MMM, h:mm a");
