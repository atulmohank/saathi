import "server-only";
import { db } from "./db";
import { fmtTime } from "./data";

export interface FeedItem {
  id: string;
  at: string;
  time: string;
  kind: "start" | "email" | "resolved";
  text: string;
  severity?: string;
}

const ROLE: Record<string, string> = { elder: "elder", caretaker: "caretaker", family: "family", decision_partner: "decision partner" };

/** Escalation history: simulated miss → each email → who resolved it. */
export async function escalationFeed(circleId: string, names: (id: string | null) => string | null): Promise<{ title: string; items: FeedItem[] }[]> {
  const { data } = await db()
    .from("audit_log")
    .select("id, action, entity_id, actor, after, created_at")
    .eq("circle_id", circleId)
    .in("action", ["demo_simulated_miss", "escalation_email", "dose_taken", "dose_handled"])
    .order("created_at", { ascending: false })
    .limit(80);
  const rows = (data ?? []) as { id: string; action: string; entity_id: string; actor: string | null; after: Record<string, string> | null; created_at: string }[];
  const escalated = [...new Set(rows.filter((r) => r.action === "escalation_email" || r.action === "demo_simulated_miss").map((r) => r.entity_id))].slice(0, 3);

  return escalated.map((doseId) => {
    const rs = rows.filter((r) => r.entity_id === doseId).reverse();
    // Only the latest run for this dose (a simulation resets it).
    const lastStart = rs.map((r) => r.action).lastIndexOf("demo_simulated_miss");
    const first = rs.find((r) => r.after?.med)?.after ?? {};
    const title = first.med ? `${first.elder}'s ${first.med}` : "Dose";
    const items = rs.slice(Math.max(0, lastStart)).map((r): FeedItem => {
      const a = r.after ?? {};
      if (r.action === "demo_simulated_miss")
        return { id: r.id, at: a.at, time: fmtTime(a.at), kind: "start", text: `${a.elder}'s ${a.med} not marked` };
      if (r.action === "escalation_email")
        return {
          id: r.id,
          at: a.at,
          time: fmtTime(a.at),
          kind: "email",
          severity: a.severity,
          text: `Email to ${a.to} (${ROLE[a.role] ?? a.role})${String(a.sent) === "false" ? " — not delivered" : ""}`,
        };
      return {
        id: r.id,
        at: r.created_at,
        time: fmtTime(r.created_at),
        kind: "resolved",
        text: `${r.action === "dose_taken" ? "Marked taken" : "Handled"} by ${names(r.actor) ?? "someone"} — escalation stopped for everyone`,
      };
    });
    return { title, items };
  });
}

/** Latest six emails for the in-app previews (demo circle). */
export async function recentEmails(circleId: string) {
  const { data } = await db()
    .from("email_outbox")
    .select("id, subject, body_text, body_html, sent, error, created_at, kind")
    .eq("circle_id", circleId)
    .order("created_at", { ascending: false })
    .limit(6);
  return (data ?? []) as { id: string; subject: string; body_text: string; body_html: string; sent: boolean; error: string | null; created_at: string; kind: string }[];
}
