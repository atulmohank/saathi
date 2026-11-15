import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AuthError, requireActor } from "@/lib/auth/guard";
import { fmtDateTime, getCircle } from "@/lib/data";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";
export const metadata = { title: "Audit trail — Saathi" };

const LABEL: Record<string, string> = {
  login: "Signed in",
  login_locked: "Sign-in locked after 5 wrong passcodes",
  circle_created: "Created the care circle",
  member_added: "Added a person",
  on_duty: "Went on duty",
  off_duty: "Went off duty",
  dose_taken: "Marked a dose taken",
  dose_skipped: "Marked a dose skipped",
  dose_handled: "Said “I've handled it”",
  medicine_created: "Added a medicine",
  medicine_updated: "Changed a medicine",
  medicine_removed: "Stopped a medicine",
  proposal_created: "Proposed a change",
  proposal_approved: "Approved a change",
  proposal_declined: "Declined a change",
  appointment_created: "Added an appointment",
  appointment_removed: "Removed an appointment",
  escalation_email: "Escalation email sent",
  demo_simulated_miss: "Time machine: simulated a missed dose",
  demo_seeded: "Demo data created",
};

function summary(v: unknown): string {
  if (!v || typeof v !== "object") return "";
  return Object.entries(v as Record<string, unknown>)
    .filter(([k]) => !["passcode_hash", "marked_by", "resolved_by"].includes(k))
    .map(([k, x]) => `${k.replace(/_/g, " ")}: ${Array.isArray(x) ? x.join(", ") : typeof x === "object" && x ? JSON.stringify(x) : String(x)}`)
    .join(" · ")
    .slice(0, 240);
}

/** Read-only. The audit log is append-only: the app never updates or deletes rows. */
export default async function AuditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const actor = await requireActor().catch((e) => {
    if (e instanceof AuthError) redirect("/");
    throw e;
  });
  if (actor.circleId !== id) notFound();
  if (actor.role === "elder") redirect(`/circle/${id}/today`);
  const { members } = await getCircle(id);
  const name = (mid: string | null) => (mid ? (members.find((m) => m.id === mid)?.display_name ?? "Former member") : "Saathi (automatic)");
  const { data } = await db().from("audit_log").select("id, actor, action, entity, before, after, created_at").eq("circle_id", id).order("created_at", { ascending: false }).limit(200);
  const rows = (data ?? []) as { id: string; actor: string | null; action: string; entity: string; before: unknown; after: unknown; created_at: string }[];

  return (
    <main id="main" className="wrap flex-1 py-8">
      <Link href={`/circle/${id}`} className="btn-ghost px-0">
        ← Back to the dashboard
      </Link>
      <h1 className="mt-4 font-serif text-4xl">Audit trail</h1>
      <p className="mt-2 max-w-2xl text-[#3D4A43]">Every change in this care circle, newest first. Nobody can edit or delete these entries. Showing the latest 200.</p>
      <div className="card mt-6 overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-left text-sm">
          <thead className="bg-[#F5F0E8]">
            <tr>
              <th scope="col" className="p-3">When (IST)</th>
              <th scope="col" className="p-3">Who</th>
              <th scope="col" className="p-3">What</th>
              <th scope="col" className="p-3">Details</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-[#EFE9DE] align-top">
                <td className="whitespace-nowrap p-3">{fmtDateTime(r.created_at)}</td>
                <td className="p-3 font-medium">{name(r.actor)}</td>
                <td className="p-3">{LABEL[r.action] ?? r.action.replace(/_/g, " ")}</td>
                <td className="p-3 text-muted">
                  {r.before ? <span>Before: {summary(r.before)}. </span> : null}
                  {summary(r.after)}
                </td>
              </tr>
            ))}
            {!rows.length && (
              <tr>
                <td colSpan={4} className="p-3 text-muted">
                  Nothing recorded yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
