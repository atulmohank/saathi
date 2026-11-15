import "server-only";
import { db } from "./db";

/** Append-only audit log. App code only ever inserts. */
export async function audit(entry: {
  circleId: string;
  actor: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  before?: unknown;
  after?: unknown;
}): Promise<void> {
  await db()
    .from("audit_log")
    .insert({
      circle_id: entry.circleId,
      actor: entry.actor,
      action: entry.action,
      entity: entry.entity,
      entity_id: entry.entityId ?? null,
      before: entry.before ?? null,
      after: entry.after ?? null,
    });
}
