import bcrypt from "bcryptjs";
import type { SupabaseClient } from "@supabase/supabase-js";
import { addDays } from "date-fns";
import { expandSchedule, istDate } from "../engine/schedule";

export const DEMO_PASSCODE = "1234";

/**
 * (Re)create the fictional demo circle: Kamala (68, independent) and Joseph (84, supported).
 * Deletes any existing demo circle first (cascade). Used by `npm run seed` and "Reset demo".
 */
export async function seedDemo(sb: SupabaseClient, now = new Date()): Promise<{ circleId: string }> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const must = (r: { data: unknown; error: { message: string } | null }, what: string): any => {
    if (r.error || r.data === null) throw new Error(`seed ${what}: ${r.error?.message ?? "no data"}`);
    return r.data;
  };

  await sb.from("care_circles").delete().eq("is_demo", true);

  const circle = must(
    await sb.from("care_circles").insert({ name: "Demo: Kamala & Joseph's circle", is_demo: true, code: "DEMO" }).select("id").single(),
    "circle",
  );
  const cid = circle.id as string;

  const elders = must(
    await sb
      .from("elders")
      .insert([
        {
          circle_id: cid,
          display_name: "Kamala",
          age: 68,
          autonomy_mode: "independent",
          preferred_language: "hi",
          emergency_info: {
            blood_group: "B+",
            allergies: ["Penicillin"],
            conditions: ["Type 2 diabetes", "Hypertension"],
            doctor_name: "Dr. Meera Nair",
            doctor_phone: "+91 90000 00001",
          },
        },
        {
          circle_id: cid,
          display_name: "Joseph",
          age: 84,
          autonomy_mode: "supported",
          preferred_language: "ml",
          emergency_info: {
            blood_group: "O+",
            allergies: [],
            conditions: ["Alzheimer's (moderate)", "Atrial fibrillation"],
            doctor_name: "Dr. Thomas Kurian",
            doctor_phone: "+91 90000 00002",
          },
        },
      ], { defaultToNull: false })
      .select("id, display_name"),
    "elders",
  ) as { id: string; display_name: string }[];
  const kamala = elders.find((e) => e.display_name === "Kamala")!.id;
  const joseph = elders.find((e) => e.display_name === "Joseph")!.id;

  const hash = await bcrypt.hash(DEMO_PASSCODE, 10);
  const members = must(
    await sb
      .from("members")
      .insert([
        { circle_id: cid, elder_id: kamala, display_name: "Kamala", role: "elder", email: "kamala@example.invalid", passcode_hash: hash },
        { circle_id: cid, display_name: "Priya", role: "family", email: "priya@example.invalid", passcode_hash: hash },
        { circle_id: cid, display_name: "Nurse Lakshmi", role: "caretaker", email: "lakshmi@example.invalid", passcode_hash: hash, is_on_duty: true },
        { circle_id: cid, elder_id: joseph, display_name: "Joseph", role: "elder", email: "joseph@example.invalid", passcode_hash: hash },
        { circle_id: cid, display_name: "Ravi", role: "decision_partner", email: "ravi@example.invalid", passcode_hash: hash },
      ], { defaultToNull: false })
      .select("id, display_name"),
    "members",
  ) as { id: string; display_name: string }[];
  const mid = (n: string) => members.find((m) => m.display_name === n)!.id;

  const meds = must(
    await sb
      .from("medicines")
      .insert([
        { elder_id: kamala, name: "Metformin", dose_text: "500 mg, 1 tablet", times: ["08:00", "20:00"], pill_look: "white oval", instructions: "After food", stock_count: 24, is_critical: false },
        { elder_id: kamala, name: "Amlodipine", dose_text: "5 mg, 1 tablet", times: ["08:00"], pill_look: "pink round", instructions: "Morning, with water", stock_count: 3, is_critical: true },
        { elder_id: kamala, name: "Vitamin D3", dose_text: "1 capsule", times: ["13:00"], pill_look: "yellow capsule", instructions: "With lunch", stock_count: 40, is_critical: false },
        { elder_id: joseph, name: "Donepezil", dose_text: "10 mg, 1 tablet", times: ["21:00"], pill_look: "yellow round", instructions: "At bedtime", stock_count: 20, is_critical: false },
        { elder_id: joseph, name: "Apixaban", dose_text: "2.5 mg, 1 tablet", times: ["08:00", "20:00"], pill_look: "orange oval", instructions: "Do not skip — blood thinner", stock_count: 30, is_critical: true },
        { elder_id: joseph, name: "Paracetamol", dose_text: "500 mg", times: ["13:00"], pill_look: "white round", instructions: "After lunch", stock_count: 15, is_critical: false },
      ], { defaultToNull: false })
      .select("id, elder_id, name, times"),
    "medicines",
  ) as { id: string; elder_id: string; name: string; times: string[] }[];

  // 7 days of history up to today (IST). Past doses get a realistic mix.
  const today = istDate(now);
  const from = istDate(addDays(now, -6));
  const doses = expandSchedule(meds.map((m) => ({ id: m.id, times: m.times, active: true })), from, today);
  const rows = doses.map((d, i) => {
    const med = meds.find((m) => m.id === d.medicineId)!;
    const isKamala = med.elder_id === kamala;
    const past = d.scheduledAt.getTime() < now.getTime() - 3 * 3600_000;
    if (!past) return { medicine_id: d.medicineId, scheduled_at: d.scheduledAt.toISOString(), status: "pending" };
    const roll = (i * 37) % 23;
    const marker = isKamala ? mid("Kamala") : mid("Nurse Lakshmi");
    const takenAt = new Date(d.scheduledAt.getTime() + ((i * 7) % 25) * 60000).toISOString();
    if (roll === 3) return { medicine_id: d.medicineId, scheduled_at: d.scheduledAt.toISOString(), status: "missed", escalation_level: 2 };
    if (roll === 7 && isKamala)
      return { medicine_id: d.medicineId, scheduled_at: d.scheduledAt.toISOString(), status: "skipped", reason: "chose_to_skip", marked_by: marker, marked_at: takenAt };
    if (roll === 11)
      return { medicine_id: d.medicineId, scheduled_at: d.scheduledAt.toISOString(), status: "skipped", reason: "side_effect", marked_by: marker, marked_at: takenAt };
    return { medicine_id: d.medicineId, scheduled_at: d.scheduledAt.toISOString(), status: "taken", marked_by: marker, marked_at: takenAt };
  });
  must(await sb.from("dose_events").insert(rows, { defaultToNull: false }).select("id"), "dose_events");

  must(
    await sb
      .from("appointments")
      .insert([
        { elder_id: kamala, doctor_name: "Dr. Meera Nair", specialty: "Diabetologist", location: "Sunrise Clinic, Indiranagar", starts_at: addDays(now, 2).toISOString(), notes: "Quarterly HbA1c review" },
        { elder_id: joseph, doctor_name: "Dr. Thomas Kurian", specialty: "Neurologist", location: "City Neuro Centre", starts_at: addDays(now, 5).toISOString(), notes: "Memory follow-up" },
      ], { defaultToNull: false })
      .select("id"),
    "appointments",
  );

  const amlodipine = meds.find((m) => m.name === "Amlodipine")!;
  must(
    await sb
      .from("change_proposals")
      .insert({
        elder_id: kamala,
        medicine_id: meds.find((m) => m.name === "Vitamin D3")!.id,
        proposed_by: mid("Priya"),
        source: "family",
        diff: { times: ["09:00"], instructions: "With breakfast" },
      })
      .select("id"),
    "proposals",
  );
  must(
    await sb
      .from("tasks")
      .insert({ circle_id: cid, kind: "refill", title: `Refill ${amlodipine.name} for Kamala (3 left)`, assigned_to: mid("Nurse Lakshmi") })
      .select("id"),
    "tasks",
  );
  await sb.from("audit_log").insert({ circle_id: cid, actor: null, action: "demo_seeded", entity: "care_circle", entity_id: cid });

  return { circleId: cid };
}
