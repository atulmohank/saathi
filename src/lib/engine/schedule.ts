import { addDays, parseISO } from "date-fns";
import { format } from "date-fns";
import { fromZonedTime, formatInTimeZone } from "date-fns-tz";
import { IST } from "./types";

export interface ScheduleMedicine {
  id: string;
  times: string[]; // 'HH:mm' in IST
  active: boolean;
}

export interface ScheduledDose {
  medicineId: string;
  scheduledAt: Date; // UTC instant
  localDate: string; // yyyy-MM-dd in IST
  localTime: string; // HH:mm in IST
}

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

/**
 * Expand each active medicine's daily times into dose instances for every IST
 * calendar day from `fromDate` to `toDate` inclusive (both 'yyyy-MM-dd').
 */
export function expandSchedule(meds: ScheduleMedicine[], fromDate: string, toDate: string, tz = IST): ScheduledDose[] {
  const out: ScheduledDose[] = [];
  const end = parseISO(toDate);
  for (let day = parseISO(fromDate); day <= end; day = addDays(day, 1)) {
    const localDate = format(day, "yyyy-MM-dd");
    for (const m of meds) {
      if (!m.active) continue;
      for (const t of [...new Set(m.times)].sort()) {
        if (!TIME_RE.test(t)) continue;
        out.push({ medicineId: m.id, scheduledAt: fromZonedTime(`${localDate}T${t}:00`, tz), localDate, localTime: t });
      }
    }
  }
  return out.sort((a, b) => a.scheduledAt.getTime() - b.scheduledAt.getTime() || a.medicineId.localeCompare(b.medicineId));
}

export type Slot = "morning" | "noon" | "night";

/** Pillbox compartment for an IST 'HH:mm' time. */
export function slotOf(time: string): Slot {
  const h = Number(time.slice(0, 2));
  if (h < 12) return "morning";
  if (h < 17) return "noon";
  return "night";
}

export function istDate(d: Date): string {
  return formatInTimeZone(d, IST, "yyyy-MM-dd");
}
