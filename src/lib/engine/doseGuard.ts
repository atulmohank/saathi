import { formatInTimeZone } from "date-fns-tz";
import { IST, type DoseStatus } from "./types";

export interface DoseLog {
  id: string;
  medicineId: string;
  scheduledAt: Date;
  status: DoseStatus;
  markedAt: Date | null;
  markedByName: string | null;
}

export interface GuardResult {
  blocked: boolean;
  message: string;
}

/** How early a dose may be marked as taken. */
export const EARLY_WINDOW_MINUTES = 120;

const hm = (d: Date) => formatInTimeZone(d, IST, "h:mm a");

export function checkDoubleDose(doseLogs: DoseLog[], scheduledDoseId: string, now: Date): GuardResult {
  const dose = doseLogs.find((d) => d.id === scheduledDoseId);
  if (!dose) return { blocked: true, message: "This dose could not be found." };

  if (dose.status === "taken") {
    const when = dose.markedAt ? hm(dose.markedAt) : "earlier";
    const who = dose.markedByName ? `, marked by ${dose.markedByName}` : "";
    return { blocked: true, message: `Already taken at ${when}${who}.` };
  }

  const minutesEarly = (dose.scheduledAt.getTime() - now.getTime()) / 60000;
  if (minutesEarly > EARLY_WINDOW_MINUTES) {
    return { blocked: true, message: `This dose is not due until ${hm(dose.scheduledAt)}.` };
  }

  // Same medicine already taken within the last 2 hours (e.g. two close slots).
  const recent = doseLogs.find(
    (d) =>
      d.id !== dose.id &&
      d.medicineId === dose.medicineId &&
      d.status === "taken" &&
      d.markedAt !== null &&
      Math.abs(now.getTime() - d.markedAt.getTime()) < EARLY_WINDOW_MINUTES * 60000,
  );
  if (recent && recent.markedAt) {
    const who = recent.markedByName ? `, marked by ${recent.markedByName}` : "";
    return { blocked: true, message: `This medicine was already taken at ${hm(recent.markedAt)}${who}.` };
  }

  return { blocked: false, message: "OK" };
}
