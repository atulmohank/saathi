import type { DoseStatus } from "./types";

export interface AdherenceLog {
  scheduledAt: Date;
  status: DoseStatus;
  reason: string | null;
}

export interface AdherenceResult {
  taken: number;
  missed: number;
  /** Skipped by her own choice ("chose_to_skip"). */
  choseToSkip: number;
  /** Skipped for another reason (ran out, side effect, unwell). */
  skippedOther: number;
  /** taken / all closed doses. */
  overallRate: number | null;
  /** taken / (closed doses minus her own choices) — not punitive about her decisions. */
  rateExcludingChoices: number | null;
}

/**
 * Two numbers on purpose: the overall rate, and a rate that does not count her
 * deliberate "I chose to skip" as a failure. Pending doses are ignored.
 */
export function adherenceRate(logs: AdherenceLog[], window: { from: Date; to: Date }): AdherenceResult {
  const inWindow = logs.filter((l) => l.scheduledAt >= window.from && l.scheduledAt < window.to && l.status !== "pending");
  const taken = inWindow.filter((l) => l.status === "taken").length;
  const missed = inWindow.filter((l) => l.status === "missed").length;
  const choseToSkip = inWindow.filter((l) => l.status === "skipped" && l.reason === "chose_to_skip").length;
  const skippedOther = inWindow.filter((l) => l.status === "skipped" && l.reason !== "chose_to_skip").length;

  const total = taken + missed + choseToSkip + skippedOther;
  const totalExcl = total - choseToSkip;
  const round = (n: number) => Math.round(n * 1000) / 10;
  return {
    taken,
    missed,
    choseToSkip,
    skippedOther,
    overallRate: total ? round(taken / total) : null,
    rateExcludingChoices: totalExcl ? round(taken / totalExcl) : null,
  };
}
