export const ROLES = ["elder", "caretaker", "family", "decision_partner"] as const;
export type Role = (typeof ROLES)[number];

export const MODES = ["independent", "assisted", "supported"] as const;
export type Mode = (typeof MODES)[number];

export const ACTIONS = [
  "view",
  "mark_dose",
  "edit_medicine",
  "approve_change",
  "manage_members",
  "edit_profile",
] as const;
export type Action = (typeof ACTIONS)[number];

export const MISS_REASONS = [
  "ran_out",
  "side_effect",
  "forgot",
  "chose_to_skip",
  "not_feeling_well",
] as const;
export type MissReason = (typeof MISS_REASONS)[number];

export const CHANGE_SOURCES = ["family", "caretaker", "elder", "decision_partner", "doctor_instruction"] as const;
export type ChangeSource = (typeof CHANGE_SOURCES)[number];

export const DOSE_STATUSES = ["pending", "taken", "missed", "skipped"] as const;
export type DoseStatus = (typeof DOSE_STATUSES)[number];

export type Severity = "info" | "gentle" | "urgent";

export const IST = "Asia/Kolkata";
