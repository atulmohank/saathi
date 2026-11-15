/* eslint-disable @next/next/no-img-element -- fixed-crop avatars and brand SVG */
import { demoPhoto } from "@/lib/demo/photos";
import { isOpen } from "@/lib/next-dose";
import { CalendarLink } from "@/components/CalendarLink";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { StatTiles } from "@/components/dashboard/StatTiles";
import { TimeMachinePanel } from "@/components/dashboard/TimeMachinePanel";
import { MODE_INFO, ROLE_LABEL, STATUS_STYLE } from "@/components/dashboard/labels";
import Link from "next/link";
import { after } from "next/server";
import { escalationFeed, recentEmails } from "@/lib/demo-feed";
import { lazyTick } from "@/lib/scheduler";
import { notFound, redirect } from "next/navigation";
import { AppointmentForm, MarkDose, MedicineForm, ProposalDecision, RemoveAppointment } from "@/components/DashboardActions";
import { MembersPanel } from "@/components/MembersPanel";
import { Pill } from "@/components/Pill";
import { Pillbox } from "@/components/Pillbox";
import { authorize } from "@/lib/auth/access";
import { AuthError, requireActor } from "@/lib/auth/guard";
import { fmtDateTime, fmtTime, getCircle, getElderCare } from "@/lib/data";
import { describeDiff } from "@/lib/describe";
import { resolveChangeFlow } from "@/lib/engine/changes";
import { istDate } from "@/lib/engine/schedule";
import { uuid } from "@/lib/validation";

export const dynamic = "force-dynamic";

export default async function CirclePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ elder?: string }> }) {
  const { id } = await params;
  if (!uuid.safeParse(id).success) notFound();
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
  after(() => lazyTick(id).catch((e) => console.error("lazy scheduler", e)));
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
  const photo = circle.is_demo ? demoPhoto(elder.display_name) : null;
  const nextAppt = care.appointments.find((a) => new Date(a.starts_at) > now);

  return (
    <div className="flex-1">
      <DashboardHeader id={id} circleName={circle.name} actorName={actor.name} roleLabel={ROLE_LABEL[actor.role]} elder={elder} elders={elders} photo={photo} mode={mode} />

      <main id="main" className="wrap relative -mt-20 flex flex-col gap-8 pb-16">
        <StatTiles
          elderName={elder.display_name}
          adherence={care.adherence}
          todayTaken={care.todayDoses.filter((d) => d.status === "taken").length}
          todayTotal={care.todayDoses.length}
          nextAppt={nextAppt}
        />

        {circle.is_demo && <TimeMachinePanel feed={feed} emails={emails} />}

        <section aria-labelledby="pb-h" className="card p-5 sm:p-8">
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
          <div className="flex flex-col gap-10">
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
                  {isOpen(d) && can("mark_dose") && <MarkDose doseId={d.id} label={`${d.medicine.name} at ${fmtTime(d.scheduled_at)}`} />}
                </li>
              ))}
              {!care.todayDoses.length && (
                <li className="card flex flex-col items-center gap-3 p-6 text-center text-muted">
                  <img src="/brand/illustrations/nothing-scheduled.svg" alt="" width={240} height={200} className="h-28 w-auto" />
                  No medicines scheduled today.
                </li>
              )}
            </ol>
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
          </div>

          <div className="flex flex-col gap-6">
            <section aria-labelledby="prop-h" className="rounded-[32px] bg-[linear-gradient(160deg,#FFF4EC_0%,#F6E3D3_100%)] p-5 sm:p-6">
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

            <section aria-labelledby="task-h" className="rounded-[32px] bg-[linear-gradient(160deg,#FFF8EA_0%,#FBEACB_100%)] p-5 sm:p-6">
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

          <section aria-labelledby="appt-h" className="rounded-[32px] bg-[linear-gradient(160deg,#EEF4F0_0%,#E7EFE9_100%)] p-5 sm:p-6">
            <h2 id="appt-h" className="h-section">
              Appointments
            </h2>
            <ul className="mt-4 flex flex-col gap-3" role="list">
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
                    <Link href={`/circle/${id}/brief/${a.id}`} className="btn-ghost mt-1 px-0 text-sm font-semibold">
                      Doctor Visit Brief →
                    </Link>
                      <CalendarLink title={`${elder.display_name}: ${a.doctor_name}`} startsAt={a.starts_at} location={a.location} details={a.notes} className="text-sm" />
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
          </div>
        </div>

        <section aria-labelledby="mem-h">
          <h2 id="mem-h" className="h-section">
            Care circle
          </h2>
          {circle.code && (
            <p className="mt-1 text-sm text-muted">
              Circle code for sign-in: <strong className="font-mono text-ink">{circle.code}</strong>
            </p>
          )}
          <MembersPanel
            elderId={elder.id}
            meId={actor.memberId}
            canManage={can("manage_members")}
            members={members.map((m) => ({ id: m.id, name: m.display_name, role: m.role, roleLabel: ROLE_LABEL[m.role], email: null, onDuty: m.is_on_duty, photo: circle.is_demo ? demoPhoto(m.display_name) : null }))}
          />
        </section>
      </main>
    </div>
  );
}
