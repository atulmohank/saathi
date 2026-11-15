import { z } from "zod";
import type { DoseStatus } from "./engine/types";

/** Deterministic Doctor Visit Brief. Pure: no I/O, fully unit-tested. */

export interface BriefInput {
  elderName: string;
  doctor: string;
  windowDays: number;
  meds: { name: string; dose: string; isCritical: boolean }[];
  doses: { medName: string; status: DoseStatus; reason: string | null }[];
}

export interface MedStat {
  name: string;
  dose: string;
  taken: number;
  missed: number;
  skipped: number;
  total: number;
  rate: number | null;
}

export interface TemplateBrief {
  adherence: { overall: number | null; excludingChoices: number | null; taken: number; total: number };
  perMedicine: MedStat[];
  sideEffects: { med: string; count: number }[];
  skipReasons: Record<string, number>;
  questions: string[];
  summary: string[];
}

const REASON_LABEL: Record<string, string> = {
  ran_out: "ran out",
  side_effect: "side effect",
  forgot: "forgot",
  chose_to_skip: "chose to skip",
  not_feeling_well: "not feeling well",
};
export const reasonLabel = (r: string) => REASON_LABEL[r] ?? r.replace(/_/g, " ");
const pct = (n: number, d: number) => (d ? Math.round((n / d) * 1000) / 10 : null);
const times = (n: number) => (n === 1 ? "once" : `${n} times`);

export function buildBrief(input: BriefInput): TemplateBrief {
  const closed = input.doses.filter((d) => d.status !== "pending");
  const taken = closed.filter((d) => d.status === "taken").length;
  const choices = closed.filter((d) => d.status === "skipped" && d.reason === "chose_to_skip").length;

  const perMedicine: MedStat[] = input.meds.map((m) => {
    const ds = closed.filter((d) => d.medName === m.name);
    const t = ds.filter((d) => d.status === "taken").length;
    return {
      name: m.name,
      dose: m.dose,
      taken: t,
      missed: ds.filter((d) => d.status === "missed").length,
      skipped: ds.filter((d) => d.status === "skipped").length,
      total: ds.length,
      rate: pct(t, ds.length),
    };
  });

  const skipReasons: Record<string, number> = {};
  for (const d of closed) if (d.status === "skipped" && d.reason) skipReasons[d.reason] = (skipReasons[d.reason] ?? 0) + 1;

  const countBy = (reason: string) => {
    const m = new Map<string, number>();
    for (const d of closed) if (d.reason === reason) m.set(d.medName, (m.get(d.medName) ?? 0) + 1);
    return [...m.entries()].map(([med, count]) => ({ med, count })).sort((a, b) => b.count - a.count || a.med.localeCompare(b.med));
  };
  const sideEffects = countBy("side_effect");
  const who = input.elderName;

  const q: string[] = [];
  for (const s of sideEffects) q.push(`${who} reported side effects with ${s.med} ${times(s.count)}. Should the dose or the medicine change?`);
  for (const m of perMedicine) {
    const med = input.meds.find((x) => x.name === m.name)!;
    if (med.isCritical && m.missed > 0) q.push(`${m.name} is critical and was missed ${times(m.missed)}. What should we do when a dose is missed?`);
    else if (m.rate !== null && m.total >= 3 && m.rate < 80) q.push(`${m.name} was taken ${m.taken} of ${m.total} times. Is there a simpler schedule?`);
  }
  for (const c of countBy("chose_to_skip")) q.push(`${who} chose to skip ${c.med} ${times(c.count)}. Is it still needed?`);
  for (const c of countBy("ran_out")) q.push(`${c.med} ran out ${times(c.count)}. Can the prescription cover a longer period?`);
  const unwell = countBy("not_feeling_well").reduce((a, c) => a + c.count, 0);
  if (unwell) q.push(`${who} felt unwell ${times(unwell)} when a dose was due. Could a medicine be the cause?`);
  q.push("Are all current medicines still needed, and are any of them interacting?");

  const overall = pct(taken, closed.length);
  const excl = pct(taken, closed.length - choices);
  const summary = [
    closed.length
      ? `In the last ${input.windowDays} days ${who} took ${taken} of ${closed.length} scheduled doses (${overall}%).${choices ? ` Not counting ${choices} dose${choices === 1 ? "" : "s"} ${who} chose to skip: ${excl}%.` : ""}`
      : `No doses were recorded in the last ${input.windowDays} days.`,
    sideEffects.length ? `Side effects reported: ${sideEffects.map((s) => `${s.med} (${times(s.count)})`).join(", ")}.` : "No side effects reported.",
    Object.keys(skipReasons).length
      ? `Reasons given for skipped doses: ${Object.entries(skipReasons)
          .map(([r, n]) => `${reasonLabel(r)} (${n})`)
          .join(", ")}.`
      : "No doses were skipped with a reason.",
  ];

  return {
    adherence: { overall, excludingChoices: excl, taken, total: closed.length },
    perMedicine,
    sideEffects,
    skipReasons,
    questions: q.slice(0, 8),
    summary,
  };
}

/** What Gemini must return. Treated as untrusted: validated, length-capped, rendered as text. */
export const geminiBriefSchema = z.object({
  summary_en: z.string().min(20).max(1500),
  questions_en: z.array(z.string().min(5).max(250)).min(1).max(8),
  summary_local: z.string().max(2500).default(""),
  questions_local: z.array(z.string().max(400)).max(8).default([]),
});
export type GeminiBrief = z.infer<typeof geminiBriefSchema>;

export interface PlainBrief extends GeminiBrief {
  source: "gemini" | "template";
}

/** Parse model output (string, possibly fenced) → validated brief, or null. */
export function parseGeminiBrief(raw: unknown): GeminiBrief | null {
  if (typeof raw !== "string") return null;
  const text = raw
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```$/, "")
    .trim();
  try {
    const r = geminiBriefSchema.safeParse(JSON.parse(text));
    return r.success ? r.data : null;
  } catch {
    return null;
  }
}

export function templateAsPlain(t: TemplateBrief): PlainBrief {
  return { source: "template", summary_en: t.summary.join(" "), questions_en: t.questions, summary_local: "", questions_local: [] };
}

/** Try the generator; on throw, timeout or invalid output, fall back to the deterministic template. */
export async function briefWithFallback(t: TemplateBrief, generate: () => Promise<string>, timeoutMs = 20000): Promise<PlainBrief> {
  try {
    const raw = await Promise.race([generate(), new Promise<never>((_, rej) => setTimeout(() => rej(new Error("timeout")), timeoutMs))]);
    const parsed = parseGeminiBrief(raw);
    return parsed ? { ...parsed, source: "gemini" } : templateAsPlain(t);
  } catch {
    return templateAsPlain(t);
  }
}
