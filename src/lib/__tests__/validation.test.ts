import { describe, expect, it } from "vitest";
import { appointmentSchema, loginSchema, medicineSchema, memberSchema, markDoseSchema } from "../validation";

const goodMed = { name: "Metformin", doseText: "500 mg", times: ["08:00", "20:00"], pillLook: "white oval", instructions: "After food", stockCount: 20, isCritical: false };

describe("medicineSchema", () => {
  it("accepts a valid medicine", () => {
    expect(medicineSchema.safeParse(goodMed).success).toBe(true);
  });
  it.each([
    ["bad time 8am", { times: ["8am"] }],
    ["bad time 24:00", { times: ["24:00"] }],
    ["bad time 07:60", { times: ["07:60"] }],
    ["no times", { times: [] }],
    ["duplicate times", { times: ["08:00", "08:00"] }],
    ["too many times", { times: ["00:00", "01:00", "02:00", "03:00", "04:00", "05:00", "06:00", "07:00", "08:00"] }],
    ["negative stock", { stockCount: -1 }],
    ["fractional stock", { stockCount: 1.5 }],
    ["huge stock", { stockCount: 10001 }],
    ["empty name", { name: "   " }],
    ["oversized name", { name: "x".repeat(81) }],
    ["oversized instructions", { instructions: "x".repeat(301) }],
    ["oversized dose", { doseText: "x".repeat(61) }],
  ])("rejects %s", (_n, patch) => {
    expect(medicineSchema.safeParse({ ...goodMed, ...patch }).success).toBe(false);
  });
});

describe("other schemas", () => {
  it.each([
    ["login: non-digit passcode", loginSchema, { memberId: "00000000-0000-4000-8000-000000000001", passcode: "abcd" }, false],
    ["login: short passcode", loginSchema, { memberId: "00000000-0000-4000-8000-000000000001", passcode: "123" }, false],
    ["login: bad uuid", loginSchema, { memberId: "1 OR 1=1", passcode: "1234" }, false],
    ["login: ok", loginSchema, { memberId: "00000000-0000-4000-8000-000000000001", passcode: "1234" }, true],
    ["mark dose: unknown reason", markDoseSchema, { doseEventId: "00000000-0000-4000-8000-000000000001", status: "skipped", reason: "lazy" }, false],
    ["mark dose: status missed not allowed from UI", markDoseSchema, { doseEventId: "00000000-0000-4000-8000-000000000001", status: "missed" }, false],
    ["mark dose: ok", markDoseSchema, { doseEventId: "00000000-0000-4000-8000-000000000001", status: "skipped", reason: "chose_to_skip" }, true],
    ["appointment: no offset", appointmentSchema, { doctorName: "Dr X", startsAt: "2026-11-20T10:00:00" }, false],
    ["appointment: ok", appointmentSchema, { doctorName: "Dr X", startsAt: "2026-11-20T10:00:00+05:30" }, true],
    ["member: bad role", memberSchema, { displayName: "A", role: "admin", passcode: "1234" }, false],
    ["member: bad email", memberSchema, { displayName: "A", role: "family", passcode: "1234", email: "nope" }, false],
  ] as [string, { safeParse: (v: unknown) => { success: boolean } }, unknown, boolean][])("%s", (_n, schema, value, ok) => {
    expect(schema.safeParse(value).success).toBe(ok);
  });
});

import { circleCodeSchema, createCircleSchema } from "../validation";
import { CODE_ALPHABET, newCircleCode } from "../circle-code";

describe("createCircleSchema", () => {
  const good = {
    circleName: "Amma's circle",
    elder: {
      displayName: "Amma",
      age: 78,
      autonomyMode: "assisted",
      preferredLanguage: "ta",
      emergency: { bloodGroup: "B+", allergies: ["Penicillin"], conditions: [], doctorName: "Dr. Rao", doctorPhone: "+91 98765 43210" },
    },
    members: [
      { displayName: "Meena", email: "meena@example.com", role: "family", passcode: "4821" },
      { displayName: "Amma", email: "", role: "elder", passcode: "1111" },
    ],
  };
  const patch = (fn: (g: typeof good) => void) => {
    const g = structuredClone(good);
    fn(g);
    return g;
  };
  it("accepts a valid circle", () => {
    expect(createCircleSchema.safeParse(good).success).toBe(true);
  });
  it.each([
    ["no members", patch((g) => (g.members = []))],
    ["two elders", patch((g) => (g.members[0].role = "elder"))],
    ["duplicate names (case-insensitive)", patch((g) => (g.members[1].displayName = "MEENA"))],
    ["short passcode", patch((g) => (g.members[0].passcode = "12"))],
    ["letters in passcode", patch((g) => (g.members[0].passcode = "abcd"))],
    ["bad email", patch((g) => (g.members[0].email = "meena@"))],
    ["admin role", patch((g) => (g.members[0].role = "admin"))],
    ["unknown language", patch((g) => (g.elder.preferredLanguage = "fr"))],
    ["unknown mode", patch((g) => (g.elder.autonomyMode = "free"))],
    ["age too low", patch((g) => (g.elder.age = 12))],
    ["bad blood group", patch((g) => (g.elder.emergency.bloodGroup = "C+"))],
    ["phone with letters", patch((g) => (g.elder.emergency.doctorPhone = "call me"))],
    ["too many allergies", patch((g) => (g.elder.emergency.allergies = Array(11).fill("x")))],
    ["oversized circle name", patch((g) => (g.circleName = "x".repeat(81)))],
    ["eleven members", patch((g) => (g.members = Array.from({ length: 11 }, (_, i) => ({ displayName: `P${i}`, email: "", role: "family", passcode: "1234" }))))],
  ])("rejects %s", (_n, value) => {
    expect(createCircleSchema.safeParse(value).success).toBe(false);
  });
});

describe("circle codes", () => {
  it.each([
    ["demo", "DEMO"],
    [" k7m2qx ", "K7M2QX"],
  ])("normalises %s", (raw, out) => {
    expect(circleCodeSchema.parse(raw)).toBe(out);
  });
  it.each(["AB", "TOOLONGCODE", "AB-12", "ab cd"])("rejects %s", (raw) => {
    expect(circleCodeSchema.safeParse(raw).success).toBe(false);
  });
  it("generates 6 unambiguous characters that pass the schema", () => {
    for (let i = 0; i < 200; i++) {
      const c = newCircleCode();
      expect(c).toHaveLength(6);
      expect([...c].every((ch) => CODE_ALPHABET.includes(ch))).toBe(true);
      expect(circleCodeSchema.parse(c)).toBe(c);
    }
    expect(CODE_ALPHABET).not.toMatch(/[01OIL]/);
  });
});

import { DICTS, pickLang, t } from "@/i18n";

describe("elder-view dictionaries", () => {
  const keys = Object.keys(DICTS.en).sort();
  it.each(Object.keys(DICTS))("%s has every key, non-empty, same placeholders", (lang) => {
    const d = DICTS[lang as keyof typeof DICTS] as Record<string, string>;
    expect(Object.keys(d).sort()).toEqual(keys);
    for (const k of keys) {
      expect(d[k].trim().length).toBeGreaterThan(0);
      const ph = (s: string) => (s.match(/\{\w+\}/g) ?? []).sort().join();
      expect(ph(d[k])).toBe(ph((DICTS.en as Record<string, string>)[k]));
    }
  });
  it("falls back to the elder's language, then English", () => {
    expect(pickLang("ml", "en")).toBe("ml");
    expect(pickLang("fr", "ta")).toBe("ta");
    expect(pickLang(undefined, "xx")).toBe("en");
    expect(t("ta", "greeting", { name: "Kamala" })).toBe("வணக்கம், Kamala");
  });
});

import { medicinePatchSchema } from "../validation";

describe("medicinePatchSchema (regression: partial edits must not reset other fields)", () => {
  it("keeps only the fields that were sent", () => {
    expect(medicinePatchSchema.parse({ times: ["09:00"] })).toEqual({ times: ["09:00"] });
    expect(medicinePatchSchema.parse({ active: false })).toEqual({ active: false });
  });
  it("still validates what is sent", () => {
    expect(medicinePatchSchema.safeParse({ times: ["9am"] }).success).toBe(false);
    expect(medicinePatchSchema.safeParse({ stockCount: -1 }).success).toBe(false);
  });
});
