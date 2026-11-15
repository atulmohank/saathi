/* eslint-disable @next/next/no-img-element -- small fixed-crop avatar */
import Link from "next/link";
import { after } from "next/server";
import { notFound, redirect } from "next/navigation";
import { lazyTick } from "@/lib/scheduler";
import { ElderDoseCard, ElderProposal, type NextDose } from "@/components/ElderToday";
import { ElderSky, SKY_BG, skyPhase } from "@/components/ElderSky";
import { GLASS } from "@/components/elder-styles";
import { SignOut } from "@/components/SignOut";
import { LANG_LABELS, pickLang, t, DICTS, SPEECH_LANG, type UiLang } from "@/i18n";
import { AuthError, requireActor } from "@/lib/auth/guard";
import { fmtDateTime, fmtTime, getCircle, getElderCare } from "@/lib/data";
import { describeDiff } from "@/lib/describe";
import { demoPhoto } from "@/lib/demo/photos";
import { pickNextDose } from "@/lib/next-dose";
import { CalendarLink } from "@/components/CalendarLink";
import { uuid } from "@/lib/validation";

export const dynamic = "force-dynamic";

export default async function ElderTodayPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ lang?: string; sky?: string }> }) {
  const { id } = await params;
  if (!uuid.safeParse(id).success) notFound();
  const { lang: langParam, sky: skyParam } = await searchParams;
  const actor = await requireActor().catch((e) => {
    if (e instanceof AuthError) redirect("/");
    throw e;
  });
  if (actor.circleId !== id) redirect("/");
  if (actor.role !== "elder") redirect(`/circle/${id}`);

  const { circle, elders, members } = await getCircle(id);
  const elder = elders.find((e) => e.id === actor.elderId);
  if (!elder) redirect("/");
  const lang: UiLang = pickLang(langParam, elder.preferred_language);
  const care = await getElderCare(elder, members);
  after(() => lazyTick(id).catch((e) => console.error("lazy scheduler", e)));
  const now = new Date();

  // Missed doses stay open: she can still mark one taken late (or say why she skipped it).
  const pick = pickNextDose(care.todayDoses);
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

  // Header: time-of-day sky, date in her language, today's progress.
  // ?sky=morning|afternoon|evening previews the other skies (demo / review); default is the real IST time.
  const phase = skyParam === "morning" || skyParam === "afternoon" || skyParam === "evening" ? skyParam : skyPhase(now);
  const dark = phase === "evening";
  const date = new Intl.DateTimeFormat(SPEECH_LANG[lang], { weekday: "long", day: "numeric", month: "long", timeZone: "Asia/Kolkata" }).format(now);
  const taken = care.todayDoses.filter((d) => d.status === "taken").length;
  const total = care.todayDoses.length;
  const photo = circle?.is_demo ? demoPhoto(elder.display_name) : null;
  const sky = dark ? "text-[#FBF7F0]" : "text-ink";
  const skySoft = dark ? "text-[#E3E9F2]" : "text-ink-soft";

  return (
    <div lang={lang} className={`relative isolate min-h-full flex-1 text-[22px] ${SKY_BG[phase]} ${dark ? "on-dark" : ""}`}>
      <ElderSky phase={phase} />

      <header className="wrap max-w-3xl pb-6 pt-6 sm:pt-8">
        <nav aria-label={t(lang, "language")} className="flex flex-wrap justify-end gap-1.5">
          {(Object.keys(DICTS) as UiLang[]).map((l) => (
            <Link
              key={l}
              href={`?lang=${l}`}
              lang={l}
              aria-current={l === lang ? "true" : undefined}
              className={`inline-flex min-h-11 items-center rounded-full px-4 text-[18px] font-semibold transition-colors ${
                l === lang ? "bg-primary text-white shadow-[var(--lift-1)]" : dark ? "bg-white/12 text-[#FBF7F0] ring-1 ring-white/30 hover:bg-white/20" : "bg-white/70 text-primary ring-1 ring-primary/25 hover:bg-white"
              }`}
            >
              {LANG_LABELS[l]}
            </Link>
          ))}
        </nav>

        <div className="mt-8 flex items-center gap-5">
          {photo ? (
            <img src={photo} alt="" width={96} height={96} className="size-20 shrink-0 rounded-full object-cover ring-4 ring-white/80 shadow-[var(--lift-2)] sm:size-24" />
          ) : (
            <span aria-hidden="true" className="grid size-20 shrink-0 place-items-center rounded-full bg-primary font-serif text-4xl text-white ring-4 ring-white/80 sm:size-24">
              {elder.display_name.slice(0, 1)}
            </span>
          )}
          <div className="min-w-0">
            <h1 className={`text-[38px] font-semibold leading-tight sm:text-[48px] ${sky}`} style={{ fontVariationSettings: '"opsz" 36' }}>
              {t(lang, "greeting", { name: elder.display_name })}
            </h1>
            <p className={`mt-1 text-[22px] ${skySoft}`}>
              {date} · {t(lang, phase)}
            </p>
          </div>
        </div>

        {total > 0 && (
          <p className={`mt-6 inline-flex flex-wrap items-center gap-3 rounded-[22px] px-5 py-2.5 text-[20px] font-semibold ${dark ? "bg-white/12 text-[#FBF7F0] ring-1 ring-white/25" : "bg-white/75 text-ink shadow-[var(--lift-1)]"}`}>
            <span aria-hidden="true" className="flex gap-1.5">
              {care.todayDoses.map((d) => (
                <span key={d.id} className={`size-3.5 rounded-full ${d.status === "taken" ? "bg-success" : d.status === "skipped" ? "bg-accent" : dark ? "bg-white/35" : "bg-[#D6CFC3]"}`} />
              ))}
            </span>
            {t(lang, "takenToday", { taken, total })}
          </p>
        )}
      </header>

      <main id="main" className="wrap flex max-w-3xl flex-col gap-10 pb-20">
        <ElderDoseCard dose={next} lang={lang} readOnly={supported} helperLine={helperLine} />

        {elder.autonomy_mode === "independent" && pending.length > 0 && (
          <section aria-labelledby="prop-h">
            <h2 id="prop-h" className={`text-[30px] font-semibold ${sky}`}>
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
          <section aria-labelledby="chg-h" className={`${GLASS} p-6 text-ink sm:p-8`}>
            <h2 id="chg-h" className="text-[30px] font-semibold">
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
            <h2 id="later-h" className={`text-[30px] font-semibold ${sky}`}>
              {t(lang, "laterToday")}
            </h2>
            <ul className="mt-4 flex flex-col gap-3" role="list">
              {later.map((d) => (
                <li key={d.id} className={`${GLASS} flex items-center gap-4 px-6 py-5 text-ink`}>
                  <span className="rounded-full bg-sage px-4 py-1.5 text-[22px] font-semibold text-primary">{fmtTime(d.scheduled_at)}</span>
                  <span>
                    {d.medicine.name}, {d.medicine.dose_text}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {appt && (
          <section aria-labelledby="appt-h" className={`${GLASS} p-6 text-ink sm:p-8`}>
            <h2 id="appt-h" className="text-[30px] font-semibold">
              {t(lang, "nextAppointment")}
            </h2>
            <p className="mt-2 font-semibold">
              {appt.doctor_name}
              {appt.specialty ? ` (${appt.specialty})` : ""}
            </p>
            <p>{fmtDateTime(appt.starts_at)}</p>
            {appt.location && <p className="text-ink-soft">{appt.location}</p>}
            <CalendarLink title={`${elder.display_name}: ${appt.doctor_name}`} startsAt={appt.starts_at} location={appt.location} label={t(lang, "addToCalendar")} newTabText={t(lang, "newTab")} className="mt-3 text-[22px]" />
          </section>
        )}

        <div>
          <SignOut label={t(lang, "signOut")} className={`text-[22px] ${dark ? "!text-[#FBF7F0]" : ""}`} />
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
