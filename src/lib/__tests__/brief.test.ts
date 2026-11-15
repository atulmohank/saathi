import { describe, expect, it } from "vitest";
import { briefWithFallback, buildBrief, parseGeminiBrief, type BriefInput } from "../brief";

const meds = [
  { name: "Metformin", dose: "500 mg", isCritical: false },
  { name: "Amlodipine", dose: "5 mg", isCritical: true },
];
const d = (medName: string, status: "taken" | "missed" | "skipped" | "pending", reason: string | null = null) => ({ medName, status, reason });
const input = (doses: BriefInput["doses"]): BriefInput => ({ elderName: "Kamala", doctor: "Dr. Nair", windowDays: 30, meds, doses });

describe("buildBrief (deterministic template)", () => {
  it("empty history", () => {
    const b = buildBrief(input([]));
    expect(b.adherence).toEqual({ overall: null, excludingChoices: null, taken: 0, total: 0 });
    expect(b.summary[0]).toBe("No doses were recorded in the last 30 days.");
    expect(b.questions).toEqual(["Are all current medicines still needed, and are any of them interacting?"]);
  });

  it("perfect adherence → only the general question", () => {
    const b = buildBrief(input([d("Metformin", "taken"), d("Metformin", "taken"), d("Amlodipine", "taken")]));
    expect(b.adherence.overall).toBe(100);
    expect(b.questions).toHaveLength(1);
    expect(b.summary[1]).toBe("No side effects reported.");
  });

  it.each([
    [
      "side effect",
      [d("Metformin", "skipped", "side_effect"), d("Metformin", "skipped", "side_effect")],
      "Kamala reported side effects with Metformin 2 times. Should the dose or the medicine change?",
    ],
    ["critical missed", [d("Amlodipine", "missed")], "Amlodipine is critical and was missed once. What should we do when a dose is missed?"],
    [
      "low adherence (non-critical, ≥3 doses)",
      [d("Metformin", "taken"), d("Metformin", "missed"), d("Metformin", "missed")],
      "Metformin was taken 1 of 3 times. Is there a simpler schedule?",
    ],
    ["chose to skip", [d("Metformin", "skipped", "chose_to_skip")], "Kamala chose to skip Metformin once. Is it still needed?"],
    ["ran out", [d("Amlodipine", "skipped", "ran_out")], "Amlodipine ran out once. Can the prescription cover a longer period?"],
    [
      "not feeling well",
      [d("Metformin", "skipped", "not_feeling_well"), d("Amlodipine", "skipped", "not_feeling_well")],
      "Kamala felt unwell 2 times when a dose was due. Could a medicine be the cause?",
    ],
  ] as [string, BriefInput["doses"], string][])("%s → suggested question", (_n, doses, q) => {
    expect(buildBrief(input(doses)).questions).toContain(q);
  });

  it("pending doses are ignored; her own choices reported separately", () => {
    const b = buildBrief(
      input([d("Metformin", "taken"), d("Metformin", "taken"), d("Metformin", "taken"), d("Metformin", "skipped", "chose_to_skip"), d("Metformin", "pending")]),
    );
    expect(b.adherence).toEqual({ overall: 75, excludingChoices: 100, taken: 3, total: 4 });
    expect(b.summary[0]).toContain("Not counting 1 dose Kamala chose to skip: 100%.");
    expect(b.summary[2]).toBe("Reasons given for skipped doses: chose to skip (1).");
  });

  it("per-medicine stats", () => {
    const b = buildBrief(input([d("Metformin", "taken"), d("Metformin", "missed"), d("Amlodipine", "skipped", "ran_out")]));
    expect(b.perMedicine).toEqual([
      { name: "Metformin", dose: "500 mg", taken: 1, missed: 1, skipped: 0, total: 2, rate: 50 },
      { name: "Amlodipine", dose: "5 mg", taken: 0, missed: 0, skipped: 1, total: 1, rate: 0 },
    ]);
  });

  it("caps questions at 8", () => {
    const many = Array.from({ length: 12 }, (_, i) => ({ name: `Med${i}`, dose: "1", isCritical: false }));
    const b = buildBrief({ ...input(many.map((m) => d(m.name, "skipped", "side_effect"))), meds: many });
    expect(b.questions).toHaveLength(8);
  });
});

const good = JSON.stringify({
  summary_en: "Kamala took most of her medicines this month.",
  questions_en: ["Should Metformin change?"],
  summary_local: "कमला ने...",
  questions_local: ["क्या..."],
});

describe("Gemini output is untrusted", () => {
  it.each([
    ["valid JSON", good, true],
    ["fenced JSON", "```json\n" + good + "\n```", true],
    ["not JSON", "Sure! Here is your brief", false],
    ["wrong shape", JSON.stringify({ text: "hi" }), false],
    ["too many questions", JSON.stringify({ summary_en: "x".repeat(30), questions_en: Array(9).fill("question?") }), false],
    ["oversized summary", JSON.stringify({ summary_en: "x".repeat(1501), questions_en: ["q is ok"] }), false],
    ["non-string", 42, false],
  ])("%s → %s", (_n, raw, ok) => {
    expect(parseGeminiBrief(raw) !== null).toBe(ok);
  });
});

describe("briefWithFallback", () => {
  const t = buildBrief(input([d("Metformin", "skipped", "side_effect")]));
  it("uses Gemini when valid", async () => {
    const r = await briefWithFallback(t, async () => good);
    expect(r.source).toBe("gemini");
    expect(r.summary_local).toBe("कमला ने...");
  });
  it.each([
    ["generator throws", async () => Promise.reject(new Error("429"))],
    ["invalid output", async () => "not json"],
    ["schema mismatch", async () => JSON.stringify({ summary_en: "short" })],
    ["timeout", () => new Promise<string>((res) => setTimeout(() => res(good), 200))],
  ] as [string, () => Promise<string>][])("falls back to the template when %s", async (_n, gen) => {
    const r = await briefWithFallback(t, gen, 50);
    expect(r.source).toBe("template");
    expect(r.questions_en).toEqual(t.questions);
    expect(r.summary_en).toContain("Side effects reported: Metformin (once).");
  });
});
