import type { Action, Mode, Role } from "./types";

export interface PermissionResult {
  allowed: boolean;
  reason: string;
}

const allow = (reason: string): PermissionResult => ({ allowed: true, reason });
const deny = (reason: string): PermissionResult => ({ allowed: false, reason });

/**
 * Who may do what, per autonomy mode. Pure and exhaustive: every
 * (role, mode, action) triple returns an explicit decision + human reason.
 *
 * Note: `edit_medicine` means "may initiate a change". Whether that change is
 * applied now or becomes a proposal is decided by `resolveChangeFlow`.
 */
export function canPerform(role: Role, mode: Mode, action: Action): PermissionResult {
  switch (action) {
    case "view":
      return allow("Everyone in the care circle can see the elder's care.");

    case "mark_dose":
      if (mode === "supported") {
        return role === "caretaker" ? allow("In supported mode the caretaker marks doses.") : deny("In supported mode only the caretaker marks doses.");
      }
      if (role === "elder") return allow("She marks her own doses.");
      return allow("Others may mark a dose; it is logged with their name.");

    case "edit_medicine":
      if (role === "elder") {
        return mode === "supported" ? deny("In supported mode medicine changes go through the decision partner.") : allow("She can change her own medicines.");
      }
      return allow("Can suggest or make changes; the change flow decides if approval is needed.");

    case "approve_change":
      if (mode === "independent") {
        return role === "elder" ? allow("In independent mode she decides on every change.") : deny("In independent mode only she can approve changes.");
      }
      if (mode === "supported") {
        return role === "decision_partner"
          ? allow("In supported mode the decision partner approves changes.")
          : deny("In supported mode only the decision partner approves changes.");
      }
      return deny("In assisted mode changes apply immediately; there is nothing to approve.");

    case "manage_members":
    case "edit_profile":
      if (mode === "independent") {
        return role === "elder" || role === "family"
          ? allow("She and her family manage her circle together.")
          : deny("Only she or her family can change this.");
      }
      if (mode === "assisted") {
        return role === "caretaker" ? deny("Caretakers cannot change the circle or profile.") : allow("She, her family or decision partner can change this.");
      }
      return role === "family" || role === "decision_partner"
        ? allow("In supported mode family and the decision partner manage this.")
        : deny("In supported mode only family or the decision partner can change this.");
  }
}
