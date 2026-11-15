import { describe, expect, it } from "vitest";
import { resolveChangeFlow, type ChangeFlow } from "../changes";
import type { ChangeSource, Mode, Role } from "../types";

const cases: [Mode, ChangeSource, Role, ChangeFlow][] = [
  // doctor_instruction always bypasses approval
  ["independent", "doctor_instruction", "family", "apply_now"],
  ["independent", "doctor_instruction", "caretaker", "apply_now"],
  ["supported", "doctor_instruction", "caretaker", "apply_now"],
  ["supported", "doctor_instruction", "family", "apply_now"],
  ["assisted", "doctor_instruction", "family", "apply_now"],
  // independent: she decides
  ["independent", "elder", "elder", "apply_now"],
  ["independent", "family", "family", "needs_elder_approval"],
  ["independent", "caretaker", "caretaker", "needs_elder_approval"],
  ["independent", "decision_partner", "decision_partner", "needs_elder_approval"],
  // assisted: applied immediately with a "What changed" card
  ["assisted", "family", "family", "apply_now"],
  ["assisted", "caretaker", "caretaker", "apply_now"],
  ["assisted", "elder", "elder", "apply_now"],
  // supported: decision partner approves
  ["supported", "family", "family", "needs_decision_partner"],
  ["supported", "caretaker", "caretaker", "needs_decision_partner"],
  ["supported", "decision_partner", "decision_partner", "apply_now"],
];

describe("resolveChangeFlow", () => {
  it.each(cases)("%s / source=%s / actor=%s → %s", (mode, source, actorRole, expected) => {
    expect(resolveChangeFlow({ mode, source, actorRole })).toBe(expected);
  });
});
