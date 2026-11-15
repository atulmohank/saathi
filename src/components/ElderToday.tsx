"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { MISS_REASONS } from "@/lib/engine/types";
import { t, SPEECH_LANG, type UiLang } from "@/i18n";
import { post } from "./client-api";
import { Pill } from "./Pill";
import { ReadAloud } from "./ReadAloud";
import { GLASS } from "./elder-styles";

export interface NextDose {
  id: string;
  time: string;
  name: string;
  dose: string;
  pillLook: string;
  instructions: string;
  display: "due" | "upcoming" | "missed";
}


export function ElderDoseCard({ dose, lang, readOnly, helperLine }: { dose: NextDose | null; lang: UiLang; readOnly: boolean; helperLine: string | null }) {
  const router = useRouter();
  const [stage, setStage] = useState<"main" | "reasons">("main");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!dose) {
    return (
      <section aria-labelledby="next-h" className={`${GLASS} flex flex-col items-center p-8 text-center sm:p-12`}>
        {/* eslint-disable-next-line @next/next/no-img-element -- decorative illustration */}
        <img src="/brand/illustrations/all-doses-taken.svg" alt="" width={240} height={200} className="mb-4 h-44 w-auto" />
        <h2 id="next-h" className="text-[34px] font-semibold leading-tight text-ink">
          {t(lang, "allDone")}
        </h2>
        <p aria-live="polite" className="mt-4 text-[22px] font-medium text-success">
          {message}
        </p>
      </section>
    );
  }

  const speech = `${t(lang, "nextDose")}: ${dose.name}, ${dose.dose}, ${t(lang, "at", { time: dose.time })}. ${dose.instructions}`;

  async function mark(status: "taken" | "skipped", reason: string | null = null) {
    if (!dose) return;
    setBusy(true);
    setError(null);
    const { ok, data } = await post<{ note?: string }>("/api/doses/mark", { doseEventId: dose.id, status, reason });
    setBusy(false);
    if (!ok) {
      setError(data.error ?? "Error");
      return;
    }
    setMessage(t(lang, status === "taken" ? "markedThanks" : "skipThanks"));
    setStage("main");
    router.refresh();
  }

  return (
    <section aria-labelledby="next-h" className={`${GLASS} p-6 text-ink sm:p-10`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="next-h" className="font-sans text-[22px] font-semibold tracking-normal text-ink-soft">
          {t(lang, "nextDose")}
        </h2>
        {dose.display !== "upcoming" && (
          <span className={`badge text-[20px] ${dose.display === "missed" ? "bg-[#FBEDEC] text-danger" : "bg-[#FDF0D8] text-saffron-ink"}`}>{t(lang, dose.display)}</span>
        )}
      </div>

      <div className="mt-6 flex items-center gap-4 sm:gap-7">
        <span aria-hidden="true" className="grid size-[72px] shrink-0 place-items-center rounded-full bg-[radial-gradient(circle_at_35%_30%,#FFFFFF_0%,#F6E3D3_70%)] shadow-[inset_0_-6px_14px_rgb(138_90_18/.12),var(--lift-1)] sm:size-28">
          <span className="block w-12 sm:w-16 [&_svg]:!h-auto [&_svg]:!w-full"><Pill look={dose.pillLook} size={64} /></span>
        </span>
        <div className="min-w-0">
          <p className="font-serif text-[36px] font-semibold leading-[1.05] [overflow-wrap:anywhere] sm:text-[56px]" style={{ fontVariationSettings: '"opsz" 36' }}>
            {dose.name}
          </p>
          <p className="mt-1 text-[24px] text-ink-soft">{dose.dose}</p>
        </div>
      </div>

      <p className="mt-6 inline-flex items-center gap-2 rounded-[22px] bg-sage px-5 py-2 text-[26px] font-semibold text-primary">
        <svg aria-hidden="true" viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 2" />
        </svg>
        {t(lang, "at", { time: dose.time })}
      </p>

      {dose.instructions && (
        <p className="mt-5 text-[24px] leading-snug">
          <span className="font-semibold">{t(lang, "instructions")}:</span> {dose.instructions}
        </p>
      )}

      <div className="mt-6">
        <ReadAloud text={speech} lang={SPEECH_LANG[lang]} label={t(lang, "readAloud")} stopLabel={t(lang, "stopReading")} missingLabel={t(lang, "voiceMissing")} />
      </div>

      {readOnly ? (
        helperLine && <p className="mt-6 rounded-[24px] bg-sage p-6 text-[26px] font-semibold leading-snug text-primary">{helperLine}</p>
      ) : stage === "main" ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <button type="button" className="btn-primary min-h-20 min-w-0 whitespace-normal py-3 text-center text-[24px] leading-tight [overflow-wrap:anywhere] sm:text-[28px]" disabled={busy} onClick={() => mark("taken")}>
            ✓ {t(lang, "tookIt")}
          </button>
          <button type="button" className="btn-secondary min-h-20 min-w-0 whitespace-normal py-3 text-center text-[24px] leading-tight [overflow-wrap:anywhere] sm:text-[28px]" disabled={busy} onClick={() => setStage("reasons")}>
            {t(lang, "notNow")}
          </button>
        </div>
      ) : (
        <fieldset className="mt-6">
          <legend className="text-[26px] font-semibold">{t(lang, "whyNot")}</legend>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {MISS_REASONS.map((r) => (
              <button key={r} type="button" className="btn-secondary min-h-16 min-w-0 whitespace-normal py-3 text-center text-[22px] leading-tight [overflow-wrap:anywhere]" disabled={busy} onClick={() => mark("skipped", r)}>
                {t(lang, r)}
              </button>
            ))}
            <button type="button" className="btn-ghost min-h-16 justify-center text-[22px]" onClick={() => setStage("main")}>
              {t(lang, "cancel")}
            </button>
          </div>
        </fieldset>
      )}

      <p aria-live="polite" className="mt-4 text-[22px] font-medium text-success">
        {message}
      </p>
      <p role="alert" className="mt-2 text-[22px] font-medium text-danger">
        {error}
      </p>
    </section>
  );
}

export function ElderProposal({ id, line, detail, lang }: { id: string; line: string; detail: string; lang: UiLang }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function decide(decision: "approve" | "decline") {
    setBusy(true);
    const { ok, data } = await post(`/api/proposals/${id}`, { decision });
    setBusy(false);
    if (!ok) setError(data.error ?? "Error");
    else router.refresh();
  }
  return (
    <li className={`${GLASS} p-6 text-ink sm:p-8`}>
      <p className="text-[24px] font-semibold leading-snug">{line}</p>
      <p className="mt-2 text-[22px] text-ink-soft">{detail}</p>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <button type="button" className="btn-primary min-h-16 min-w-0 whitespace-normal py-3 text-center text-[22px] leading-tight [overflow-wrap:anywhere] sm:text-[24px]" disabled={busy} onClick={() => decide("approve")}>
          {t(lang, "approve")}
        </button>
        <button type="button" className="btn-secondary min-h-16 min-w-0 whitespace-normal py-3 text-center text-[22px] leading-tight [overflow-wrap:anywhere] sm:text-[24px]" disabled={busy} onClick={() => decide("decline")}>
          {t(lang, "askDoctor")}
        </button>
      </div>
      <p role="alert" className="mt-2 text-[22px] text-danger">
        {error}
      </p>
    </li>
  );
}

