import { describe, expect, it } from "vitest";
import { nextEscalationStep, type EscalationInput } from "../escalation";
import { MODES, type MissReason, type Mode, type Role, type Severity } from "../types";

const base = (o: Partial<EscalationInput>): EscalationInput => ({
  mode: "independent",
  minutesLate: 0,
  reason: null,
  isCritical: false,
  alreadyNotified: [],
  resolved: false,
  ...o,
});

describe("escalation ladder per mode (no reason / forgot)", () => {
  const cases: [Mode, number, Role[], Severity, number, boolean][] = [
    // mode, minutesLate, notify, severity, level, stop
    ["independent", 10, [], "info", 0, false],
    ["independent", 29, [], "info", 0, false],
    ["independent", 30, ["elder"], "gentle", 1, false],
    ["independent", 60, ["elder", "caretaker"], "urgent", 2, false],
    ["independent", 120, ["elder", "caretaker", "family"], "urgent", 3, true],
    ["assisted", 19, [], "info", 0, false],
    ["assisted", 20, ["elder", "caretaker"], "gentle", 1, false],
    ["assisted", 60, ["elder", "caretaker", "family"], "urgent", 2, true],
    ["supported", 9, [], "info", 0, false],
    ["supported", 10, ["caretaker"], "gentle", 1, false],
    ["supported", 30, ["caretaker", "decision_partner", "family"], "urgent", 2, true],
  ];
  for (const reason of [null, "forgot"] as const) {
    it.each(cases)(`reason=${reason}: %s at T+%i → %j`, (mode, minutesLate, notify, severity, level, stop) => {
      const r = nextEscalationStep(base({ mode, minutesLate, reason }));
      expect(r.notify).toEqual(notify);
      expect(r.severity).toBe(severity);
      expect(r.level).toBe(level);
      expect(r.stop).toBe(stop);
    });
  }
});

describe("already-notified roles are not emailed twice", () => {
  it.each([
    ["independent", 60, ["elder"], ["caretaker"]],
    ["independent", 120, ["elder", "caretaker"], ["family"]],
    ["assisted", 60, ["elder", "caretaker"], ["family"]],
    ["supported", 30, ["caretaker"], ["decision_partner", "family"]],
    ["supported", 30, ["caretaker", "decision_partner", "family"], []],
  ] as [Mode, number, Role[], Role[]][])("%s T+%i already=%j → %j", (mode, minutesLate, alreadyNotified, notify) => {
    expect(nextEscalationStep(base({ mode, minutesLate, alreadyNotified })).notify).toEqual(notify);
  });
});

describe("critical medicines escalate urgently from the first step", () => {
  it.each(MODES)("%s", (mode) => {
    const r = nextEscalationStep(base({ mode, minutesLate: 30, isCritical: true }));
    expect(r.severity).toBe("urgent");
  });
});

describe("resolved stops everything, in every mode", () => {
  it.each(MODES)("%s", (mode) => {
    const r = nextEscalationStep(base({ mode, minutesLate: 500, resolved: true, isCritical: true }));
    expect(r).toMatchObject({ notify: [], stop: true });
  });
});

describe("reason-aware handling (mode × reason × critical)", () => {
  const rows: [MissReason, boolean, Role[], Severity, string[]][] = [
    ["chose_to_skip", false, [], "info", []],
    ["chose_to_skip", true, ["caretaker"], "gentle", []],
    ["ran_out", false, [], "info", ["create_refill_task"]],
    ["ran_out", true, [], "info", ["create_refill_task"]],
    ["side_effect", false, ["caretaker"], "gentle", ["flag_doctor_brief"]],
    ["side_effect", true, ["caretaker"], "gentle", ["flag_doctor_brief"]],
    ["not_feeling_well", false, ["caretaker"], "gentle", ["flag_doctor_brief"]],
    ["not_feeling_well", true, ["caretaker"], "gentle", ["flag_doctor_brief"]],
  ];
  for (const mode of MODES) {
    it.each(rows)(`${mode}: %s critical=%s → %j %s`, (reason, isCritical, notify, severity, followUps) => {
      const r = nextEscalationStep(base({ mode, minutesLate: 200, reason, isCritical }));
      expect(r.notify).toEqual(notify);
      expect(r.severity).toBe(severity);
      expect(r.followUps).toEqual(followUps);
      expect(r.stop).toBe(true);
    });
  }

  it("chose_to_skip on critical does not re-notify a caretaker already told", () => {
    const r = nextEscalationStep(base({ reason: "chose_to_skip", isCritical: true, alreadyNotified: ["caretaker"] }));
    expect(r.notify).toEqual([]);
  });
});
