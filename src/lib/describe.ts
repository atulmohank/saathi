import { t, type UiLang } from "@/i18n";

const to12h = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  const ap = h < 12 ? "AM" : "PM";
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, "0")} ${ap}`;
};
export { to12h };

/** Plain-language summary of a medicine change, e.g. "time → 9:00 AM; How to take it → With breakfast". */
export function describeDiff(diff: Record<string, unknown>, lang: UiLang, isNew: boolean): string {
  if (diff.active === false) return t(lang, "stopMedicine");
  const parts: string[] = [];
  if (isNew) parts.push(t(lang, "newMedicine"));
  if (typeof diff.name === "string" && isNew) parts.push(diff.name);
  if (typeof diff.doseText === "string") parts.push(`${t(lang, "dose")} → ${diff.doseText}`);
  if (Array.isArray(diff.times)) parts.push(`${t(lang, "times")} → ${(diff.times as string[]).map(to12h).join(", ")}`);
  if (typeof diff.instructions === "string") parts.push(`${t(lang, "instructions")} → ${diff.instructions}`);
  if (typeof diff.pillLook === "string") parts.push(`${t(lang, "pill")} → ${diff.pillLook}`);
  if (typeof diff.stockCount === "number") parts.push(`stock → ${diff.stockCount}`);
  if (typeof diff.isCritical === "boolean") parts.push(diff.isCritical ? "critical" : "not critical");
  return parts.join("; ");
}
