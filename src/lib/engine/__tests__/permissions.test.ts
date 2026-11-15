import { describe, expect, it } from "vitest";
import { canPerform } from "../permissions";
import { ACTIONS, MODES, ROLES, type Action, type Mode, type Role } from "../types";

// Full matrix: [role, mode, action, allowed]
const Y = true;
const N = false;
type Row = [Role, Mode, Action, boolean];
const matrix: Row[] = [];
const expect3 = (action: Action, table: Record<Mode, Record<Role, boolean>>) => {
  for (const mode of MODES) for (const role of ROLES) matrix.push([role, mode, action, table[mode][role]]);
};

expect3("view", {
  independent: { elder: Y, caretaker: Y, family: Y, decision_partner: Y },
  assisted: { elder: Y, caretaker: Y, family: Y, decision_partner: Y },
  supported: { elder: Y, caretaker: Y, family: Y, decision_partner: Y },
});
expect3("mark_dose", {
  independent: { elder: Y, caretaker: Y, family: Y, decision_partner: Y },
  assisted: { elder: Y, caretaker: Y, family: Y, decision_partner: Y },
  supported: { elder: N, caretaker: Y, family: N, decision_partner: N },
});
expect3("edit_medicine", {
  independent: { elder: Y, caretaker: Y, family: Y, decision_partner: Y },
  assisted: { elder: Y, caretaker: Y, family: Y, decision_partner: Y },
  supported: { elder: N, caretaker: Y, family: Y, decision_partner: Y },
});
expect3("approve_change", {
  independent: { elder: Y, caretaker: N, family: N, decision_partner: N },
  assisted: { elder: N, caretaker: N, family: N, decision_partner: N },
  supported: { elder: N, caretaker: N, family: N, decision_partner: Y },
});
for (const action of ["manage_members", "edit_profile"] as const) {
  expect3(action, {
    independent: { elder: Y, caretaker: N, family: Y, decision_partner: N },
    assisted: { elder: Y, caretaker: N, family: Y, decision_partner: Y },
    supported: { elder: N, caretaker: N, family: Y, decision_partner: Y },
  });
}

describe("canPerform — full role × mode × action matrix", () => {
  it("covers every combination", () => {
    expect(matrix).toHaveLength(ROLES.length * MODES.length * ACTIONS.length);
  });

  it.each(matrix)("%s in %s mode → %s = %s", (role, mode, action, allowed) => {
    const r = canPerform(role, mode, action);
    expect(r.allowed).toBe(allowed);
    expect(r.reason.length).toBeGreaterThan(5);
  });
});
