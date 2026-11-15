import Link from "next/link";
import { redirect } from "next/navigation";
import { ElderDoseCard, ElderProposal, type NextDose } from "@/components/ElderToday";
import { SignOut } from "@/components/SignOut";
import { LANG_LABELS, pickLang, t, DICTS, type UiLang } from "@/i18n";
import { AuthError, requireActor } from "@/lib/auth/guard";
import { fmtDateTime, fmtTime, getCircle, getElderCare } from "@/lib/data";
import { describeDiff } from "@/lib/describe";

export const dynamic = "force-dynamic";

export default async function ElderTodayPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ lang?: string }> }) {
  const { id } = await params;
  const { lang: langParam } = await searchParams;
  const actor = await requireActor().catch((e) => {
    if (e instanceof AuthError) redirect("/");
    throw e;
  });
  if (actor.circleId !== id) redirect("/");
  if (actor.role !== "elder") redirect(`/circle/${id}`);

  const { elders, members } = await getCircle(id);
  const elder = elders.find((e) => e.id === actor.elderId);
  if (!elder) redirect("/");
  const lang: UiLang = pickLang(langParam, elder.preferred_language);
  const care = await getElderCare(elder, members);
  const now = new Date();

  const open = care.todayDoses.filter((d) => d.status === "pending");
  const pick = open.find((d) => d.display === "due" || d.display === "missed") ?? open.find((d) => d.display === "upcoming");
  const next: NextDose | null = pick
    ? {
        id: pick.id,
        time: fmtTime(pick.scheduled_at),
        name: pick.medicine.name,
        dose: pick.medicine.dose_text,
        pillLook: pick.medicine.pill_look,
        instructions: pick.medicine.instructions,
        display: pick.display as NextDose["display"],
      }
    : null;

  const supported = elder.autonomy_mode === "supported";
  const onDuty = members.find((m) => m.role === "caretaker" && m.is_on_duty) ?? members.find((m) => m.role === "caretaker");
  const helperLine = supported && next ? t(lang, "supportedLine", { name: onDuty?.display_name ?? t(lang, "helperOnDuty"), time: next.time }) : null;

  const pending = care.proposals.filter((p) => p.status === "pending");
  const later = care.todayDoses.filter((d) => d.id !== pick?.id && new Date(d.scheduled_at) > now && d.status === "pending");
  const appt = care.appointments.find((a) => new Date(a.starts_at) > now);

  return (
    <div lang={lang} className="min-h-full flex-1 text-[22px]">
      <header className="wrap flex max-w-3xl flex-wrap items-center justify-between gap-4 py-5">
        <p className="font-serif text-[32px] text-primary">{t(lang, "greeting", { name: elder.display_name })}</p>
        <nav aria-label={t(lang, "language")} className="flex items-center gap-2">
          {(Object.keys(DICTS) as UiLang[]).map((l) => (
            <Link
              key={l}
              href={`?lang=${l}`}
              lang={l}
              aria-current={l === lang ? "true" : undefined}
              className={`inline-flex min-h-12 items-center rounded-xl border-2 px-4 text-[22px] font-semibold ${l === lang ? "border-primary bg-primary text-white" : "border-primary bg-surface text-primary hover:bg-[#EEF4F1]"}`}
            >
              {LANG_LABELS[l]}
            </Link>
          ))}
        </nav>
      </header>

      <main id="main" className="wrap flex max-w-3xl flex-col gap-8 pb-16">
        <ElderDoseCard dose={next} lang={lang} readOnly={supported} helperLine={helperLine} />

        {elder.autonomy_mode === "independent" && pending.length > 0 && (
          <section aria-labelledby="prop-h">
            <h2 id="prop-h" className="font-serif text-[30px]">
              {t(lang, "proposalsTitle")}
            </h2>
            <ul className="mt-4 flex flex-col gap-4" role="list">
              {pending.map((p) => (
                <ElderProposal
                  key={p.id}
                  id={p.id}
                  lang={lang}
                  line={t(lang, "proposalLine", { who: p.proposerName ?? "Family", med: p.medName })}
                  detail={describeDiff(p.diff, lang, !p.medicine_id)}
                />
              ))}
            </ul>
          </section>
        )}

        {elder.autonomy_mode === "assisted" && care.recentChanges.length > 0 && (
          <section aria-labelledby="chg-h" className="card p-6">
            <h2 id="chg-h" className="font-serif text-[30px]">
              {t(lang, "changedTitle")}
            </h2>
            <ul className="mt-3 flex flex-col gap-2" role="list">
              {care.recentChanges.map((c) => (
                <li key={c.id}>
                  {t(lang, "changedLine", { who: c.actorName ?? "", med: c.medName })}: {describeDiff(camel(c.after ?? {}), lang, c.action === "medicine_created")}
                </li>
              ))}
            </ul>
          </section>
        )}

        {later.length > 0 && (
          <section aria-labelledby="later-h">
            <h2 id="later-h" className="font-serif text-[30px]">
              {t(lang, "laterToday")}
            </h2>
            <ul className="mt-3 flex flex-col gap-3" role="list">
              {later.map((d) => (
                <li key={d.id} className="card flex items-center justify-between gap-4 p-5">
                  <span>
                    <span className="font-semibold">{fmtTime(d.scheduled_at)}</span> · {d.medicine.name}, {d.medicine.dose_text}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {appt && (
          <section aria-labelledby="appt-h" className="card p-6">
            <h2 id="appt-h" className="font-serif text-[30px]">
              {t(lang, "nextAppointment")}
            </h2>
            <p className="mt-2">
              {appt.doctor_name}
              {appt.specialty ? ` (${appt.specialty})` : ""} · {fmtDateTime(appt.starts_at)}
            </p>
            {appt.location && <p className="text-ink">{appt.location}</p>}
          </section>
        )}

        <div>
          <SignOut label={t(lang, "signOut")} className="text-[22px]" />
        </div>
      </main>
    </div>
  );
}

/** audit rows store DB column names; map back to the diff shape describeDiff reads. */
function camel(cols: Record<string, unknown>): Record<string, unknown> {
  const map: Record<string, string> = { dose_text: "doseText", pill_look: "pillLook", stock_count: "stockCount", is_critical: "isCritical" };
  return Object.fromEntries(Object.entries(cols).map(([k, v]) => [map[k] ?? k, v]));
}
