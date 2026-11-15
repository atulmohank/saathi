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
