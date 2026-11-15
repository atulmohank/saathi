import type { MissReason, Mode, Role, Severity } from "./types";

export interface LadderStep {
  afterMinutes: number;
  notify: Role[];
}

/** Missed-dose escalation ladder per autonomy mode (minutes after scheduled time). */
export const LADDERS: Record<Mode, LadderStep[]> = {
  independent: [
    { afterMinutes: 30, notify: ["elder"] },
    { afterMinutes: 60, notify: ["caretaker"] },
    { afterMinutes: 120, notify: ["family"] },
  ],
  assisted: [
    { afterMinutes: 20, notify: ["elder", "caretaker"] },
    { afterMinutes: 60, notify: ["family"] },
  ],
  supported: [
    { afterMinutes: 10, notify: ["caretaker"] },
    { afterMinutes: 30, notify: ["decision_partner", "family"] },
  ],
};

export type FollowUp = "create_refill_task" | "flag_doctor_brief";

export interface EscalationInput {
  mode: Mode;
  minutesLate: number;
  reason: MissReason | null;
  isCritical: boolean;
  /** Roles already emailed for this dose. */
  alreadyNotified: Role[];
  /** Someone marked the dose or clicked "I've handled it". */
  resolved: boolean;
}

export interface EscalationStep {
  notify: Role[];
  severity: Severity;
  /** true = this dose needs no further escalation checks. */
  stop: boolean;
  /** Number of ladder steps that are now due (store as dose_events.escalation_level). */
  level: number;
  followUps: FollowUp[];
}

const without = (roles: Role[], already: Role[]) => roles.filter((r) => !already.includes(r));

/** Who to notify about a missed dose now, how urgently, and whether escalation is finished — by mode, minutes late, reason and criticality. */
export function nextEscalationStep(input: EscalationInput): EscalationStep {
  const { mode, minutesLate, reason, isCritical, alreadyNotified, resolved } = input;
  const done = (notify: Role[], severity: Severity, followUps: FollowUp[] = []): EscalationStep => ({
    notify: without(notify, alreadyNotified),
    severity,
    stop: true,
    level: 0,
    followUps,
  });

  // Once anyone resolves it, escalation stops for everyone. No duplicate panic.
  if (resolved) return done([], "info");

  switch (reason) {
    case "chose_to_skip":
      // Her choice is respected. Only a critical medicine gets a gentle heads-up.
      return isCritical ? done(["caretaker"], "gentle") : done([], "info");
    case "ran_out":
      return done([], "info", ["create_refill_task"]);
    case "side_effect":
      return done(["caretaker"], "gentle", ["flag_doctor_brief"]);
    case "not_feeling_well":
      return done(["caretaker"], "gentle", ["flag_doctor_brief"]);
    case "forgot":
    case null:
      break;
  }

  const ladder = LADDERS[mode];
  const due = ladder.filter((s) => minutesLate >= s.afterMinutes);
  const level = due.length;
  const notify = without(
    due.flatMap((s) => s.notify),
    alreadyNotified,
  ).filter((r, i, a) => a.indexOf(r) === i);

  let severity: Severity = level <= 1 ? "gentle" : "urgent";
  if (isCritical && level >= 1) severity = "urgent";
  if (level === 0) severity = "info";

  return { notify, severity, stop: level === ladder.length, level, followUps: [] };
}
