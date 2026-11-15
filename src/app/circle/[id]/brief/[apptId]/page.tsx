import { PageShell } from "@/components/PageShell";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { GeminiBrief } from "@/components/GeminiBrief";
import { PrintButton } from "@/components/PrintButton";
import { AuthError } from "@/lib/auth/guard";
import { reasonLabel } from "@/lib/brief";
import { LANG_NAME, loadBrief, WINDOW_DAYS } from "@/lib/brief-server";
import { fmtDateTime } from "@/lib/data";
import { uuid } from "@/lib/validation";

export const dynamic = "force-dynamic";
export const metadata = { title: "Doctor Visit Brief — Saathi" };

export default async function BriefPage({ params }: { params: Promise<{ id: string; apptId: string }> }) {
  const { id, apptId } = await params;
  if (!uuid.safeParse(apptId).success) notFound();
  const b = await loadBrief(apptId).catch((e) => {
    if (e instanceof AuthError) {
      if (e.status === 401) redirect("/");
      notFound();
    }
    throw e;
  });
  if (!b || b.actor.circleId !== id) notFound();
  const { appt, elder, template: t } = b;

  return (
    <PageShell>
    <main id="main" className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
      <div className="no-print mb-6 flex flex-wrap items-center justify-between gap-3">
        <Link href={`/circle/${id}?elder=${appt.elder_id}`} className="btn-ghost px-0">
          ← Back
        </Link>
        <PrintButton label="Print brief" />
      </div>
      <h1 className="font-serif text-4xl">Doctor Visit Brief</h1>
      <p className="mt-2 text-lg">
        {elder.display_name}
        {elder.age ? `, ${elder.age}` : ""} · {appt.doctor_name}
        {appt.specialty ? ` (${appt.specialty})` : ""} · {fmtDateTime(appt.starts_at)}
      </p>

      <section aria-labelledby="sum-h" className="card mt-6 p-6">
        <h2 id="sum-h" className="font-serif text-2xl">
          Last {WINDOW_DAYS} days
        </h2>
        <ul className="mt-3 flex flex-col gap-2" role="list">
          {t.summary.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
        <table className="mt-5 w-full border-collapse text-left text-sm">
          <caption className="sr-only">Doses per medicine</caption>
          <thead>
            <tr className="border-b border-[#E6DFD8] text-muted">
              <th scope="col" className="py-2">Medicine</th>
              <th scope="col" className="py-2">Taken</th>
              <th scope="col" className="py-2">Missed</th>
              <th scope="col" className="py-2">Skipped</th>
              <th scope="col" className="py-2">Rate</th>
            </tr>
          </thead>
          <tbody>
            {t.perMedicine.map((m) => (
              <tr key={m.name} className="border-b border-[#EFE9DE]">
                <th scope="row" className="py-2 font-semibold">
                  {m.name} <span className="font-normal text-muted">{m.dose}</span>
                </th>
                <td className="py-2">{m.taken}</td>
                <td className="py-2">{m.missed}</td>
                <td className="py-2">{m.skipped}</td>
                <td className="py-2">{m.rate === null ? "–" : `${m.rate}%`}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {Object.keys(t.skipReasons).length > 0 && (
          <p className="mt-4 text-sm text-muted">
            Skip reasons:{" "}
            {Object.entries(t.skipReasons)
              .map(([r, n]) => `${reasonLabel(r)} ${n}`)
              .join(" · ")}
          </p>
        )}
      </section>

      <section aria-labelledby="q-h" className="card mt-6 p-6">
        <h2 id="q-h" className="font-serif text-2xl">
          Suggested questions
        </h2>
        <ol className="mt-3 list-decimal pl-6">
          {t.questions.map((q) => (
            <li key={q} className="mb-1">
              {q}
            </li>
          ))}
        </ol>
      </section>

      <div className="mt-6">
        <GeminiBrief appointmentId={appt.id} langCode={elder.preferred_language} langName={LANG_NAME[elder.preferred_language] ?? "English"} />
      </div>
      <p className="mt-6 text-sm text-muted">Saathi is not a medical device. This brief summarises what the care circle recorded; the doctor decides.</p>
    </main>
    </PageShell>
  );
}
