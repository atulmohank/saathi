import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { PrintButton } from "@/components/PrintButton";
import { authorize } from "@/lib/auth/access";
import { AuthError, requireActor } from "@/lib/auth/guard";
import { getCircle } from "@/lib/data";
import { db } from "@/lib/db";
import { to12h } from "@/lib/describe";

export const dynamic = "force-dynamic";
export const metadata = { title: "Emergency card — Saathi" };

export default async function EmergencyCard({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ elder?: string }> }) {
  const { id } = await params;
  const { elder: elderParam } = await searchParams;
  const actor = await requireActor().catch((e) => {
    if (e instanceof AuthError) redirect("/");
    throw e;
  });
  if (actor.circleId !== id) notFound();
  const { elders, members } = await getCircle(id);
  const elder = elders.find((e) => e.id === (actor.role === "elder" ? actor.elderId : elderParam)) ?? elders[0];
  if (!elder || !authorize(actor, { id: elder.id, circleId: elder.circle_id, mode: elder.autonomy_mode }, "view").allowed) notFound();

  const { data: meds } = await db().from("medicines").select("name, dose_text, times, is_critical, instructions").eq("elder_id", elder.id).eq("active", true).order("name");
  const info = elder.emergency_info as { blood_group?: string; allergies?: string[]; conditions?: string[]; doctor_name?: string; doctor_phone?: string };
  const onDuty = members.filter((m) => m.role === "caretaker" && m.is_on_duty).map((m) => m.display_name);
  const partners = members.filter((m) => m.role === "decision_partner").map((m) => m.display_name);
  const family = members.filter((m) => m.role === "family").map((m) => m.display_name);
  const back = actor.role === "elder" ? `/circle/${id}/today` : `/circle/${id}?elder=${elder.id}`;

  return (
    <main id="main" className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 print:p-0">
      <div className="no-print mb-6 flex flex-wrap items-center justify-between gap-3">
        <Link href={back} className="btn-ghost px-0">
          ← Back
        </Link>
        <PrintButton label="Print emergency card" />
      </div>

      <article className="card border-2 border-danger p-6 print:border-black print:shadow-none" aria-labelledby="ec-h">
        <header className="flex flex-wrap items-baseline justify-between gap-2 border-b border-[#E6DFD8] pb-4">
          <h1 id="ec-h" className="font-serif text-3xl">
            Emergency card: {elder.display_name}
            {elder.age ? `, ${elder.age}` : ""}
          </h1>
          <p className="text-sm text-muted">Saathi · printed {new Date().toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" })}</p>
        </header>

        <dl className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-sm font-semibold text-muted">Blood group</dt>
            <dd className="text-2xl font-bold">{info.blood_group || "Not recorded"}</dd>
          </div>
          <div>
            <dt className="text-sm font-semibold text-muted">Allergies</dt>
            <dd className="text-xl font-bold text-danger print:text-black">{info.allergies?.length ? info.allergies.join(", ") : "None known"}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-sm font-semibold text-muted">Conditions</dt>
            <dd className="text-lg">{info.conditions?.length ? info.conditions.join(", ") : "None recorded"}</dd>
          </div>
          <div>
            <dt className="text-sm font-semibold text-muted">Doctor</dt>
            <dd className="text-lg">{info.doctor_name || "Not recorded"}</dd>
          </div>
          <div>
            <dt className="text-sm font-semibold text-muted">Doctor&apos;s phone</dt>
            <dd className="text-lg">{info.doctor_phone ? <a href={`tel:${info.doctor_phone.replace(/\s/g, "")}`}>{info.doctor_phone}</a> : "Not recorded"}</dd>
          </div>
        </dl>

        <section aria-labelledby="ec-meds" className="mt-6">
          <h2 id="ec-meds" className="font-serif text-xl">
            Current medicines
          </h2>
          <table className="mt-2 w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-[#E6DFD8] text-sm text-muted">
                <th scope="col" className="py-2 pr-2">Medicine</th>
                <th scope="col" className="py-2 pr-2">Dose</th>
                <th scope="col" className="py-2">Times</th>
              </tr>
            </thead>
            <tbody>
              {(meds ?? []).map((m) => (
                <tr key={m.name} className="border-b border-[#EFE9DE] align-top">
                  <td className="py-2 pr-2 font-semibold">
                    {m.name}
                    {m.is_critical && <span className="ml-2 text-sm font-bold text-danger print:text-black">(critical — do not skip)</span>}
                  </td>
                  <td className="py-2 pr-2">{m.dose_text}</td>
                  <td className="py-2">{(m.times as string[]).map(to12h).join(", ")}</td>
                </tr>
              ))}
              {!meds?.length && (
                <tr>
                  <td colSpan={3} className="py-2 text-muted">
                    No medicines recorded.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </section>

        <section aria-labelledby="ec-who" className="mt-6">
          <h2 id="ec-who" className="font-serif text-xl">
            Care circle
          </h2>
          <ul className="mt-2 text-lg" role="list">
            {onDuty.length > 0 && <li>Caretaker on duty: {onDuty.join(", ")}</li>}
            {partners.length > 0 && <li>Decision partner: {partners.join(", ")}</li>}
            {family.length > 0 && <li>Family: {family.join(", ")}</li>}
          </ul>
        </section>
      </article>
    </main>
  );
}
