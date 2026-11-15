import "server-only";
import { db } from "../db";
import type { Action, Mode, Role } from "../engine/types";
import { authorize, type Actor, type TargetElder } from "./access";
import { getSession } from "./session";

export class AuthError extends Error {
  constructor(
    public status: 401 | 403 | 404,
    message: string,
  ) {
    super(message);
  }
}

/** Current member, re-read from the DB (role/circle are never trusted from the cookie alone). */
export async function requireActor(): Promise<Actor & { name: string; demo: boolean }> {
  const s = await getSession();
  if (!s) throw new AuthError(401, "Please sign in.");
  const { data, error } = await db()
    .from("members")
    .select("id, circle_id, role, elder_id, display_name")
    .eq("id", s.sub)
    .maybeSingle();
  if (error || !data || data.circle_id !== s.cid) throw new AuthError(401, "Please sign in again.");
  return {
    memberId: data.id,
    circleId: data.circle_id,
    role: data.role as Role,
    elderId: data.elder_id,
    name: data.display_name,
    demo: s.demo,
  };
}

/** Loads the elder an action targets (id, circle, autonomy mode); 404 if missing. */
export async function loadElder(elderId: string): Promise<TargetElder> {
  const { data } = await db().from("elders").select("id, circle_id, autonomy_mode").eq("id", elderId).maybeSingle();
  if (!data) throw new AuthError(404, "Not found.");
  return { id: data.id, circleId: data.circle_id, mode: data.autonomy_mode as Mode };
}

/** Use at the top of every mutation / data read: session → membership → engine permission. */
export async function requirePermission(elderId: string, action: Action) {
  const actor = await requireActor();
  const elder = await loadElder(elderId);
  const decision = authorize(actor, elder, action);
  if (!decision.allowed) {
    // Same 404 for other circles so we don't leak existence (no IDOR oracle).
    throw new AuthError(actor.circleId === elder.circleId ? 403 : 404, decision.reason);
  }
  return { actor, elder };
}

/** Signed-in member of this circle, else 404 (no existence oracle). */
export async function requireCircleMember(circleId: string) {
  const actor = await requireActor();
  if (actor.circleId !== circleId) throw new AuthError(404, "Not found.");
  return actor;
}
