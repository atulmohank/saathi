import { canPerform, type PermissionResult } from "../engine/permissions";
import type { Action, Mode, Role } from "../engine/types";

export interface Actor {
  memberId: string;
  circleId: string;
  role: Role;
  /** For role = elder: the elder profile that is her own. */
  elderId: string | null;
}

export interface TargetElder {
  id: string;
  circleId: string;
  mode: Mode;
}

/**
 * Server-side authorization: circle membership (no IDOR) + elder-scope + role/mode
 * permission from the engine. Pure so it can be unit-tested; callers load data.
 */
export function authorize(actor: Actor, target: TargetElder, action: Action): PermissionResult {
  if (actor.circleId !== target.circleId) {
    return { allowed: false, reason: "Not a member of this care circle." };
  }
  if (actor.role === "elder" && actor.elderId !== target.id) {
    return { allowed: false, reason: "An elder can only see her own care." };
  }
  return canPerform(actor.role, target.mode, action);
}
