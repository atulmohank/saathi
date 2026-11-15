import type { Mode, Role } from "@/lib/engine/types";

/** Mode badge text and the one-line explanation shown under the elder's name ({name} is replaced). */
export const MODE_INFO: Record<Mode, { label: string; line: string; tone: string }> = {
  independent: { label: "Independent", line: "{name} marks their own doses and approves every change.", tone: "bg-[#E4EFEA] text-primary" },
  assisted: { label: "Assisted", line: "Changes apply now; {name} gets a plain-language note. {name} and the caretaker are reminded together.", tone: "bg-[#FDF3E2] text-[#7A4B00]" },
  supported: { label: "Supported", line: "The caretaker marks doses; the decision partner approves changes.", tone: "bg-[#F1ECE4] text-ink" },
};

/** Human role names. */
export const ROLE_LABEL: Record<Role, string> = { elder: "Elder", caretaker: "Caretaker", family: "Family", decision_partner: "Decision partner" };

/** Badge colours for a dose's display status. */
export const STATUS_STYLE: Record<string, string> = {
  taken: "bg-[#E4F1E8] text-success",
  skipped: "bg-[#FDF3E2] text-[#7A4B00]",
  missed: "bg-[#FBEDEC] text-danger",
  due: "bg-[#FDF3E2] text-[#7A4B00]",
  upcoming: "bg-[#F1ECE4] text-ink",
};
