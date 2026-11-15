import Link from "next/link";
import { after } from "next/server";
import { TimeMachineControls } from "@/components/TimeMachine";
import { escalationFeed, recentEmails } from "@/lib/demo-feed";
import { runScheduler } from "@/lib/scheduler";
import { redirect } from "next/navigation";
import { AppointmentForm, MarkDose, MedicineForm, ProposalDecision, RemoveAppointment } from "@/components/DashboardActions";
import { Pill } from "@/components/Pill";
import { Pillbox } from "@/components/Pillbox";
import { SignOut } from "@/components/SignOut";
import { authorize } from "@/lib/auth/access";
import { AuthError, requireActor } from "@/lib/auth/guard";
import { fmtDateTime, fmtTime, getCircle, getElderCare } from "@/lib/data";
import { describeDiff } from "@/lib/describe";
import { resolveChangeFlow } from "@/lib/engine/changes";
import { istDate } from "@/lib/engine/schedule";
import type { Mode, Role } from "@/lib/engine/types";

export const dynamic = "force-dynamic";

const MODE_INFO: Record<Mode, { label: string; line: string; tone: string }> = {
  independent: { label: "Independent", line: "{name} marks their own doses and approves every change.", tone: "bg-[#E4EFEA] text-primary" },
  assisted: { label: "Assisted", line: "Changes apply now; {name} gets a plain-language note. {name} and the caretaker are reminded together.", tone: "bg-[#FDF3E2] text-[#7A4B00]" },
  supported: { label: "Supported", line: "The caretaker marks doses; the decision partner approves changes.", tone: "bg-[#F1ECE4] text-ink" },
};

const ROLE_LABEL: Record<Role, string> = { elder: "Elder", caretaker: "Caretaker", family: "Family", decision_partner: "Decision partner" };

const STATUS_STYLE: Record<string, string> = {
  taken: "bg-[#E4F1E8] text-success",
  skipped: "bg-[#FDF3E2] text-[#7A4B00]",
  missed: "bg-[#FBEDEC] text-danger",
  due: "bg-[#FDF3E2] text-[#7A4B00]",
  upcoming: "bg-[#F1ECE4] text-ink",
};

export default async function CirclePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ elder?: string }> }) {
  const { id } = await params;
  const { elder: elderParam } = await searchParams;
  const actor = await requireActor().catch((e) => {
    if (e instanceof AuthError) redirect("/");
    throw e;
  });
  if (actor.circleId !== id) redirect("/");
  if (actor.role === "elder") redirect(`/circle/${id}/today`);

  const { circle, elders, members } = await getCircle(id);
  if (!circle || !elders.length) redirect("/");
  const elder = elders.find((e) => e.id === elderParam) ?? elders[0];
  const care = await getElderCare(elder, members);
  // Lazy missed-dose check on page load (runs after the response is sent).
  after(() => runScheduler({ circleId: id }).catch((e) => console.error("lazy scheduler", e)));
  const [feed, emails] = circle.is_demo ? await Promise.all([escalationFeed(id, care.memberName), recentEmails(id)]) : [[], []];
  const target = { id: elder.id, circleId: elder.circle_id, mode: elder.autonomy_mode };
  const can = (a: Parameters<typeof authorize>[2]) => authorize(actor, target, a).allowed;
  const now = new Date();

  const flow = resolveChangeFlow({ mode: elder.autonomy_mode, source: actor.role, actorRole: actor.role });
  const partner = members.find((m) => m.role === "decision_partner");
  const approver = flow === "needs_elder_approval" ? elder.display_name : (partner?.display_name ?? "the decision partner");
  const flowHint =
    flow === "apply_now"
      ? elder.autonomy_mode === "assisted"
        ? `Changes apply now. ${elder.display_name} gets a plain-language "What changed" note.`
        : "Changes apply now."
      : `Changes go to ${approver} to approve. Tick "doctor's instruction" to apply a doctor's change at once.`;

  const pending = care.proposals.filter((p) => p.status === "pending");
  const refillsDue = care.refills.filter((r) => r.needsRefill);
  const mode = MODE_INFO[elder.autonomy_mode];

  return (
    <div className="flex-1">
      <header className="border-b border-[#E6DFD8] bg-surface">
        <div className="wrap flex flex-wrap items-center justify-between gap-3 py-4">
          <div>
            <p className="font-serif text-xl text-primary">Saathi</p>
            <p className="text-sm text-muted">{circle.name}</p>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span>
              Signed in as <strong>{actor.name}</strong> · {ROLE_LABEL[actor.role]}
            </span>
            <SignOut />
          </div>
        </div>
        {elders.length > 1 && (
          <nav aria-label="Choose elder" className="wrap flex gap-2 pb-3">
            {elders.map((e) => (
              <Link
                key={e.id}
                href={`?elder=${e.id}`}
                aria-current={e.id === elder.id ? "page" : undefined}
                className={`inline-flex min-h-11 items-center rounded-full border-2 px-4 font-semibold ${e.id === elder.id ? "border-primary bg-primary text-white" : "border-[#D8D1C6] bg-surface text-ink hover:border-primary"}`}
              >
                {e.display_name}
              </Link>
            ))}
          </nav>
        )}
      </header>

      <main id="main" className="wrap flex flex-col gap-10 py-8">
        <section aria-labelledby="who-h" className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 id="who-h" className="font-serif text-4xl">
              {elder.display_name}
              {elder.age ? <span className="text-muted">, {elder.age}</span> : null}
            </h1>
            <p className="mt-2 flex flex-wrap items-center gap-2">
              <span className={`badge ${mode.tone}`}>{mode.label} mode</span>
              <span className="text-[#3D4A43]">{mode.line.replaceAll("{name}", elder.display_name)}</span>
            </p>
          </div>
          <dl className="flex gap-6">
            <div>
              <dt className="text-sm text-muted">Taken, last 7 days</dt>
              <dd className="font-serif text-3xl">{care.adherence.overallRate ?? "–"}%</dd>
            </div>
            <div>
              <dt className="text-sm text-muted">Not counting {elder.display_name}&apos;s own choices</dt>
              <dd className="font-serif text-3xl">{care.adherence.rateExcludingChoices ?? "–"}%</dd>
            </div>
          </dl>
        </section>

        {circle.is_demo && (
          <section aria-labelledby="tm-h" className="rounded-2xl border-2 border-dashed border-accent bg-[#FFF8EC] p-4 sm:p-6">
            <h2 id="tm-h" className="h-section">
              <span aria-hidden="true">⏩</span> Time machine
            </h2>
            <p className="mt-1 text-sm text-[#3D4A43]">
              Demo circle only. Plays out a missed dose through each care mode&apos;s escalation ladder. Real emails go only to the
              demo test inbox.
            </p>
            <div className="mt-4">
              <TimeMachineControls />
            </div>
            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              <div>
                <h3 className="font-semibold">Escalation timeline</h3>
                {feed.length === 0 ? (
                  <p className="mt-2 text-sm text-muted">Nothing yet. Simulate a missed dose.</p>
                ) : (
                  feed.map(({ title, items }, i) => (
                    <div key={i} className="mt-3">
                    <p className="text-sm font-semibold text-primary">{title}</p>
                    <ol className="mt-2 ml-1.5 border-l-2 border-[#E6DFD8] pl-4" aria-label={`Escalation steps for ${title}`}>
                      {items.map((it) => (
                        <li key={it.id} className="relative pb-3 text-sm">
                          <span
                            aria-hidden="true"
                            className={`absolute -left-[23px] top-1 size-3 rounded-full ${it.kind === "resolved" ? "bg-success" : it.kind === "start" ? "bg-muted" : it.severity === "urgent" ? "bg-danger" : "bg-accent"}`}
                          />
                          <span className="font-semibold">{it.time}</span> · {it.text}
                          {it.severity && <span className="ml-1 text-muted">({it.severity})</span>}
                        </li>
                      ))}
                    </ol>
                    </div>
                  ))
                )}
              </div>
              <div>
                <h3 className="font-semibold">Email previews</h3>
                {emails.length === 0 ? (
                  <p className="mt-2 text-sm text-muted">No emails yet.</p>
                ) : (
                  <ul className="mt-3 flex flex-col gap-2" role="list">
                    {emails.map((em) => (
                      <li key={em.id}>
                        <details className="card p-3 text-sm">
                          <summary className="min-h-11 cursor-pointer content-center font-medium">
                            {em.subject}
                            <span className={`ml-2 badge text-xs ${em.sent ? "bg-[#E4F1E8] text-success" : "bg-[#FBEDEC] text-danger"}`}>{em.sent ? "sent" : "not sent"}</span>
                          </summary>
                          <pre className="mt-2 whitespace-pre-wrap break-words font-sans text-sm text-ink">{em.body_text.replace(/https?:\/\/\S+/g, "[one-time link]")}</pre>
                        </details>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </section>
        )}

        <section aria-labelledby="pb-h" className="card p-4 sm:p-6">
          <h2 id="pb-h" className="h-section">
            This week&apos;s pillbox
          </h2>
          <p className="mt-1 text-sm text-muted">
            {care.adherence.taken} taken · {care.adherence.missed} missed · {care.adherence.choseToSkip} skipped by choice · {care.adherence.skippedOther} skipped for another reason
          </p>
          <div className="mt-4">
            <Pillbox days={care.pillbox} today={istDate(now)} />
          </div>
        </section>

        <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr]">
          <section aria-labelledby="today-h">
            <h2 id="today-h" className="h-section">
              Today
            </h2>
            {!can("mark_dose") && <p className="mt-1 text-sm text-muted">In supported mode only the caretaker marks doses.</p>}
            <ol className="mt-4 flex flex-col gap-3" role="list">
              {care.todayDoses.map((d) => (
                <li key={d.id} className="card flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <Pill look={d.medicine.pill_look} />
                    <div>
                      <p className="font-semibold">
                        {fmtTime(d.scheduled_at)} · {d.medicine.name}
                        {d.medicine.is_critical && <span className="ml-2 badge bg-[#FBEDEC] text-xs text-danger">Critical</span>}
                      </p>
                      <p className="text-sm text-muted">{d.medicine.dose_text}</p>
                      <p className="mt-1 text-sm">
                        <span className={`badge text-xs ${STATUS_STYLE[d.display]}`}>{d.display === "due" ? "Due now" : d.display[0].toUpperCase() + d.display.slice(1)}</span>
                        {d.markedByName && d.marked_at && (
                          <span className="ml-2 text-muted">
                            by {d.markedByName} at {fmtTime(d.marked_at)}
                          </span>
                        )}
                        {d.reason && <span className="ml-2 text-muted">· {d.reason.replace(/_/g, " ")}</span>}
                      </p>
                    </div>
                  </div>
                  {d.status === "pending" && can("mark_dose") && <MarkDose doseId={d.id} label={`${d.medicine.name} at ${fmtTime(d.scheduled_at)}`} />}
                </li>
              ))}
              {!care.todayDoses.length && <li className="text-muted">No medicines scheduled today.</li>}
            </ol>
          </section>

          <div className="flex flex-col gap-10">
            <section aria-labelledby="prop-h">
              <h2 id="prop-h" className="h-section">
                Change requests
              </h2>
              {pending.length === 0 ? (
                <p className="mt-2 text-muted">No changes waiting.</p>
              ) : (
                <ul className="mt-4 flex flex-col gap-3" role="list">
                  {pending.map((p) => (
                    <li key={p.id} className="card p-4">
                      <p className="font-semibold">
                        {p.proposerName ?? "Someone"} → {p.medName}
                      </p>
                      <p className="mt-1 text-sm">{describeDiff(p.diff, "en", !p.medicine_id)}</p>
                      <div className="mt-3">
                        {can("approve_change") ? (
                          <ProposalDecision id={p.id} />
                        ) : (
                          <p className="text-sm text-muted">Waiting for {elder.autonomy_mode === "independent" ? elder.display_name : (partner?.display_name ?? "the decision partner")} to decide.</p>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section aria-labelledby="task-h">
              <h2 id="task-h" className="h-section">
                Tasks
              </h2>
              <ul className="mt-3 flex flex-col gap-2" role="list">
                {care.tasks.map((tk) => (
                  <li key={tk.id} className="card p-3 text-sm">
                    <span className="badge mr-2 bg-[#FDF3E2] text-xs text-[#7A4B00]">{tk.kind}</span>
                    {tk.title}
                    {tk.assigned_to && <span className="text-muted"> · {care.memberName(tk.assigned_to)}</span>}
                  </li>
                ))}
                {refillsDue
                  .filter((r) => !care.tasks.some((tk) => tk.title.includes(r.med.name)))
                  .map((r) => (
                    <li key={r.med.id} className="card p-3 text-sm">
                      <span className="badge mr-2 bg-[#FBEDEC] text-xs text-danger">refill soon</span>
                      {r.med.name}: {r.daysLeft} day{r.daysLeft === 1 ? "" : "s"} left
                    </li>
                  ))}
                {!care.tasks.length && !refillsDue.length && <li className="text-muted">Nothing to do.</li>}
              </ul>
            </section>
          </div>
        </div>

        <section aria-labelledby="appt-h">
          <h2 id="appt-h" className="h-section">
            Appointments
          </h2>
          <ul className="mt-4 grid gap-3 md:grid-cols-2" role="list">
            {care.appointments.map((a) => (
              <li key={a.id} className="card flex items-start justify-between gap-3 p-4">
                <div>
                  <p className="font-semibold">
                    {a.doctor_name}
                    {a.specialty && <span className="font-normal text-muted"> · {a.specialty}</span>}
                  </p>
                  <p className="text-sm">{fmtDateTime(a.starts_at)}</p>
                  {a.location && <p className="text-sm text-muted">{a.location}</p>}
                  {a.notes && <p className="mt-1 text-sm">{a.notes}</p>}
                </div>
                {can("edit_medicine") && <RemoveAppointment elderId={elder.id} id={a.id} label={a.doctor_name} />}
              </li>
            ))}
            {!care.appointments.length && <li className="text-muted">No upcoming appointments.</li>}
          </ul>
          {can("edit_medicine") && (
            <details className="card mt-4 p-4">
              <summary className="min-h-11 cursor-pointer content-center font-semibold text-primary">Add an appointment</summary>
              <div className="mt-4">
                <AppointmentForm elderId={elder.id} />
              </div>
            </details>
          )}
        </section>

        <section aria-labelledby="med-h">
          <h2 id="med-h" className="h-section">
            Medicines
          </h2>
          <p className="mt-1 text-sm text-muted">{flowHint}</p>
          <ul className="mt-4 flex flex-col gap-3" role="list">
            {care.meds
              .filter((m) => m.active)
              .map((m) => {
                const r = care.refills.find((x) => x.med.id === m.id);
                return (
                  <li key={m.id} className="card p-4">
                    <div className="flex flex-wrap items-center gap-3">
                      <Pill look={m.pill_look} />
                      <div className="flex-1">
                        <p className="font-semibold">
                          {m.name} <span className="font-normal text-muted">· {m.dose_text}</span>
                          {m.is_critical && <span className="ml-2 badge bg-[#FBEDEC] text-xs text-danger">Critical</span>}
                        </p>
                        <p className="text-sm text-muted">
                          {m.times.join(", ")} · {m.instructions || "No instructions"} · {m.stock_count} in stock
                          {r && Number.isFinite(r.daysLeft) && <> · {r.daysLeft} days left</>}
                        </p>
                      </div>
                    </div>
                    {can("edit_medicine") && (
                      <details className="mt-3">
                        <summary className="min-h-11 cursor-pointer content-center text-sm font-semibold text-primary">Change {m.name}</summary>
                        <div className="mt-3">
                          <MedicineForm
                            elderId={elder.id}
                            approver={approver}
                            flowHint={flowHint}
                            canRemove
                            initial={{ id: m.id, name: m.name, doseText: m.dose_text, times: m.times, pillLook: m.pill_look, instructions: m.instructions, stockCount: m.stock_count, isCritical: m.is_critical }}
                          />
                        </div>
                      </details>
                    )}
                  </li>
                );
              })}
          </ul>
          {can("edit_medicine") && (
            <details className="card mt-4 p-4">
              <summary className="min-h-11 cursor-pointer content-center font-semibold text-primary">Add a medicine</summary>
              <div className="mt-4">
                <MedicineForm elderId={elder.id} initial={null} approver={approver} flowHint={flowHint} canRemove={false} />
              </div>
            </details>
          )}
        </section>

        <section aria-labelledby="mem-h">
          <h2 id="mem-h" className="h-section">
            Care circle
          </h2>
          <ul className="mt-3 flex flex-wrap gap-2" role="list">
            {members.map((m) => (
              <li key={m.id} className="card px-3 py-2 text-sm">
                <strong>{m.display_name}</strong> · {ROLE_LABEL[m.role]}
                {m.is_on_duty && <span className="ml-2 badge bg-[#E4F1E8] text-xs text-success">On duty</span>}
              </li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  );
}
