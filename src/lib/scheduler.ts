import "server-only";
import { formatInTimeZone } from "date-fns-tz";
import { createActionLink } from "./action-links";
import { audit } from "./audit";
import { canPerform } from "./engine/permissions";
import { db } from "./db";
import { LADDERS, nextEscalationStep } from "./engine/escalation";
import { IST, type Mode, type Role } from "./engine/types";
import { appointmentEmail, missedDoseEmail, upcomingDoseEmail } from "./email/templates";
import { sendEmail, type Recipient } from "./email/send";

interface MemberLite {
  id: string;
  display_name: string;
  email: string | null;
  role: Role;
  elder_id: string | null;
  is_on_duty: boolean;
}
interface ElderLite {
  id: string;
  circle_id: string;
  display_name: string;
  autonomy_mode: Mode;
  care_circles: { is_demo: boolean };
}
interface MedLite {
  id: string;
  name: string;
  dose_text: string;
  instructions: string;
  is_critical: boolean;
  elders: ElderLite;
}
export interface DoseCtx {
  id: string;
  scheduled_at: string;
  status: string;
  escalation_level: number;
  notified_roles: string[];
  resolved_by: string | null;
  medicines: MedLite;
}

const hm = (iso: string | Date) => formatInTimeZone(typeof iso === "string" ? new Date(iso) : iso, IST, "h:mm a");
const DOSE_SELECT =
  "id, scheduled_at, status, escalation_level, notified_roles, resolved_by, medicines!inner(id, name, dose_text, instructions, is_critical, elders!inner(id, circle_id, display_name, autonomy_mode, care_circles!inner(is_demo)))";

const memberCache = new Map<string, MemberLite[]>();
async function circleMembers(circleId: string): Promise<MemberLite[]> {
  if (!memberCache.has(circleId)) {
    const { data } = await db().from("members").select("id, display_name, email, role, elder_id, is_on_duty").eq("circle_id", circleId);
    memberCache.set(circleId, (data ?? []) as MemberLite[]);
  }
  return memberCache.get(circleId)!;
}

/** Map ladder roles to real people. Caretaker = whoever is on duty (all caretakers if nobody is). */
export function recipientsFor(roles: Role[], members: MemberLite[], elderId: string): MemberLite[] {
  const out: MemberLite[] = [];
  for (const role of roles) {
    if (role === "elder") out.push(...members.filter((m) => m.role === "elder" && m.elder_id === elderId));
    else if (role === "caretaker") {
      const cs = members.filter((m) => m.role === "caretaker");
      const onDuty = cs.filter((m) => m.is_on_duty);
      out.push(...(onDuty.length ? onDuty : cs));
    } else out.push(...members.filter((m) => m.role === role));
  }
  return out.filter((m, i, a) => a.findIndex((x) => x.id === m.id) === i);
}

const rcpt = (m: MemberLite): Recipient => ({ memberId: m.id, name: m.display_name, email: m.email });

/** One escalation check for one dose at `now` (real or simulated). Returns emails sent. */
export async function escalateDose(dose: DoseCtx, now: Date): Promise<number> {
  const med = dose.medicines;
  const elder = med.elders;
  const minutesLate = (now.getTime() - new Date(dose.scheduled_at).getTime()) / 60000;
  const step = nextEscalationStep({
    mode: elder.autonomy_mode,
    minutesLate,
    reason: null,
    isCritical: med.is_critical,
    alreadyNotified: dose.notified_roles as Role[],
    resolved: dose.resolved_by !== null,
  });
  if (!step.notify.length && !step.stop) return 0;

  // Claim this step atomically (optimistic lock on escalation_level) → idempotent under concurrent ticks.
  const notified = [...new Set([...dose.notified_roles, ...step.notify])];
  const { data: claimed } = await db()
    .from("dose_events")
    .update({ escalation_level: step.level, notified_roles: notified, status: step.stop ? "missed" : "pending" })
    .eq("id", dose.id)
    .eq("escalation_level", dose.escalation_level)
    .eq("status", "pending")
    .is("resolved_by", null)
    .select("id");
  if (!claimed?.length) return 0;
  dose.escalation_level = step.level;
  dose.notified_roles = notified;
  if (step.stop) dose.status = "missed";

  const members = await circleMembers(elder.circle_id);
  const people = recipientsFor(step.notify, members, elder.id);
  const alreadyTold = recipientsFor(
    (notified as Role[]).filter((r) => !step.notify.includes(r)),
    members,
    elder.id,
  ).map((m) => m.display_name);

  for (const m of people) {
    const forElder = m.role === "elder";
    const canMark = canPerform(m.role, elder.autonomy_mode, "mark_dose").allowed;
    const takenUrl = canMark ? await createActionLink("dose_taken", dose.id, m.id, now) : "";
    const handledUrl = forElder ? "" : await createActionLink("handled", dose.id, m.id, now);
    const email = missedDoseEmail({
      toName: m.display_name,
      elderName: elder.display_name,
      forElder,
      medName: med.name,
      dose: med.dose_text,
      time: hm(dose.scheduled_at),
      minutesLate,
      severity: step.severity,
      isCritical: med.is_critical,
      alreadyTold,
      takenUrl,
      handledUrl,
    });
    const r = await sendEmail({ circleId: elder.circle_id, isDemo: elder.care_circles.is_demo, to: rcpt(m), kind: "missed_dose", email });
    await audit({
      circleId: elder.circle_id,
      actor: null,
      action: "escalation_email",
      entity: "dose_event",
      entityId: dose.id,
      after: { at: now.toISOString(), to: m.display_name, role: m.role, severity: step.severity, med: med.name, elder: elder.display_name, sent: r.sent },
    });
  }
  return people.length;
}

export interface TickResult {
  upcoming: number;
  escalationEmails: number;
  appointmentEmails: number;
  dosesChecked: number;
}

/** The scheduler tick: upcoming-dose reminders, missed-dose escalation, appointment reminders. */
export async function runScheduler(opts: { now?: Date; circleId?: string } = {}): Promise<TickResult> {
  const now = opts.now ?? new Date();
  memberCache.clear();
  const res: TickResult = { upcoming: 0, escalationEmails: 0, appointmentEmails: 0, dosesChecked: 0 };
  const scope = <T extends { eq: (c: string, v: string) => T }>(q: T, path: string) => (opts.circleId ? q.eq(path, opts.circleId) : q);

  // 1) Upcoming dose (T-10 min)
  const upQ = db()
    .from("dose_events")
    .select(DOSE_SELECT)
    .eq("status", "pending")
    .eq("reminded_upcoming", false)
    .gt("scheduled_at", now.toISOString())
    .lte("scheduled_at", new Date(now.getTime() + 10 * 60000).toISOString())
    .limit(50);
  const { data: upcoming } = await scope(upQ, "medicines.elders.circle_id");
  for (const d of (upcoming ?? []) as unknown as DoseCtx[]) {
    const { data: claimed } = await db().from("dose_events").update({ reminded_upcoming: true }).eq("id", d.id).eq("reminded_upcoming", false).select("id");
    if (!claimed?.length) continue;
    const elder = d.medicines.elders;
    const members = await circleMembers(elder.circle_id);
    const roles: Role[] = elder.autonomy_mode === "supported" ? ["caretaker"] : ["elder"];
    for (const m of recipientsFor(roles, members, elder.id)) {
      const email = upcomingDoseEmail({
        toName: m.display_name,
        elderName: elder.display_name,
        forElder: m.role === "elder",
        medName: d.medicines.name,
        dose: d.medicines.dose_text,
        time: hm(d.scheduled_at),
        instructions: d.medicines.instructions,
        takenUrl: await createActionLink("dose_taken", d.id, m.id, now),
      });
      await sendEmail({ circleId: elder.circle_id, isDemo: elder.care_circles.is_demo, to: rcpt(m), kind: "upcoming_dose", email });
      res.upcoming++;
    }
  }

  // 2) Missed-dose escalation (first ladder step is ≥10 min; look back 24h)
  const minFirst = Math.min(...Object.values(LADDERS).map((l) => l[0].afterMinutes));
  const missQ = db()
    .from("dose_events")
    .select(DOSE_SELECT)
    .eq("status", "pending")
    .is("resolved_by", null)
    .lte("scheduled_at", new Date(now.getTime() - minFirst * 60000).toISOString())
    .gte("scheduled_at", new Date(now.getTime() - 24 * 3600_000).toISOString())
    .order("scheduled_at")
    .limit(200);
  const { data: late } = await scope(missQ, "medicines.elders.circle_id");
  for (const d of (late ?? []) as unknown as DoseCtx[]) {
    res.dosesChecked++;
    res.escalationEmails += await escalateDose(d, now);
  }

  // 3) Appointments: 24h and 2h
  const apQ = db()
    .from("appointments")
    .select("id, doctor_name, specialty, location, starts_at, reminded_24h, reminded_2h, elders!inner(id, circle_id, display_name, autonomy_mode, care_circles!inner(is_demo))")
    .gt("starts_at", now.toISOString())
    .lte("starts_at", new Date(now.getTime() + 24 * 3600_000).toISOString())
    .or("reminded_24h.eq.false,reminded_2h.eq.false");
  const { data: appts } = await scope(apQ, "elders.circle_id");
  for (const a of (appts ?? []) as unknown as {
    id: string;
    doctor_name: string;
    specialty: string;
    location: string;
    starts_at: string;
    reminded_24h: boolean;
    reminded_2h: boolean;
    elders: ElderLite;
  }[]) {
    const within2h = new Date(a.starts_at).getTime() - now.getTime() <= 2 * 3600_000;
    const window: "24h" | "2h" | null = within2h && !a.reminded_2h ? "2h" : !within2h && !a.reminded_24h ? "24h" : null;
    if (!window) continue;
    const upd = window === "2h" ? { reminded_2h: true, reminded_24h: true } : { reminded_24h: true };
    const { data: claimed } = await db()
      .from("appointments")
      .update(upd)
      .eq("id", a.id)
      .eq(window === "2h" ? "reminded_2h" : "reminded_24h", false)
      .select("id");
    if (!claimed?.length) continue;
    const elder = a.elders;
    const members = await circleMembers(elder.circle_id);
    const roles: Role[] = elder.autonomy_mode === "supported" ? ["caretaker", "decision_partner"] : ["elder", "caretaker"];
    for (const m of recipientsFor(roles, members, elder.id)) {
      const email = appointmentEmail({
        toName: m.display_name,
        elderName: elder.display_name,
        forElder: m.role === "elder",
        doctor: a.doctor_name,
        specialty: a.specialty,
        when: formatInTimeZone(new Date(a.starts_at), IST, "EEE d MMM, h:mm a"),
        location: a.location,
        window,
      });
      await sendEmail({ circleId: elder.circle_id, isDemo: elder.care_circles.is_demo, to: rcpt(m), kind: `appointment_${window}`, email });
      res.appointmentEmails++;
    }
  }
  return res;
}

export async function loadDose(id: string): Promise<DoseCtx | null> {
  const { data } = await db().from("dose_events").select(DOSE_SELECT).eq("id", id).maybeSingle();
  return (data as unknown as DoseCtx) ?? null;
}

export const LAZY_TICK_MINUTES = 5;

/**
 * Page-load check, throttled to once per 5 minutes per circle across all
 * server instances: an atomic conditional UPDATE on care_circles.last_tick_at.
 */
export async function lazyTick(circleId: string, now = new Date()): Promise<boolean> {
  const cutoff = new Date(now.getTime() - LAZY_TICK_MINUTES * 60000).toISOString();
  const { data } = await db()
    .from("care_circles")
    .update({ last_tick_at: now.toISOString() })
    .eq("id", circleId)
    .or(`last_tick_at.is.null,last_tick_at.lt.${cutoff}`)
    .select("id");
  if (!data?.length) return false;
  await runScheduler({ now, circleId });
  return true;
}
