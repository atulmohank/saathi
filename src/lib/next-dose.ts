import type { DoseStatus } from "./engine/types";

export interface OpenDose {
  id: string;
  scheduled_at: string;
  status: DoseStatus;
  /** "due" / "missed" / "upcoming" as shown (a pending dose > 60 min late shows as missed). */
  display: string;
}

/** A dose can still be marked (taken late or skipped with a reason) until someone closes it. */
export const isOpen = (d: { status: DoseStatus }) => d.status === "pending" || d.status === "missed";

/**
 * Which dose the elder's big card shows: the earliest dose that is due or missed today
 * (so a missed dose can still be marked taken late), otherwise the next upcoming one.
 */
export function pickNextDose<T extends OpenDose>(todayDoses: T[]): T | undefined {
  const open = todayDoses.filter(isOpen).sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at));
  return open.find((d) => d.status === "missed" || d.display === "due" || d.display === "missed") ?? open.find((d) => d.display === "upcoming");
}
