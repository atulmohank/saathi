"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { MISS_REASONS } from "@/lib/engine/types";
import { t, SPEECH_LANG, type UiLang } from "@/i18n";
import { post } from "./client-api";
import { Pill } from "./Pill";
import { ReadAloud } from "./ReadAloud";

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
      <section aria-labelledby="next-h" className="card flex flex-col items-center p-6 text-center sm:p-10">
        {/* eslint-disable-next-line @next/next/no-img-element -- decorative illustration */}
        <img src="/brand/illustrations/all-doses-taken.svg" alt="" width={240} height={200} className="mb-4 h-40 w-auto" />
        <h2 id="next-h" className="font-serif text-[32px]">
          {t(lang, "allDone")}
        </h2>
        <p aria-live="polite" className="mt-4 text-[22px] text-success">
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
    <section aria-labelledby="next-h" className="card border-2 border-primary p-6 sm:p-10">
      <h2 id="next-h" className="text-[22px] font-semibold text-muted">
        {t(lang, "nextDose")}
      </h2>
      <div className="mt-4 flex items-start gap-4 sm:gap-5">
        <Pill look={dose.pillLook} size={60} />
        <div className="min-w-0">
          <p className="font-serif text-[34px] leading-tight break-words sm:text-[44px]">{dose.name}</p>
          <p className="mt-1 text-[26px]">{dose.dose}</p>
          <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[26px] font-semibold text-primary">
            {t(lang, "at", { time: dose.time })}
            {dose.display !== "upcoming" && (
              <span className={`badge text-[20px] ${dose.display === "missed" ? "bg-[#FBEDEC] text-danger" : "bg-[#FDF3E2] text-[#7A4B00]"}`}>
                {t(lang, dose.display)}
              </span>
            )}
          </p>
        </div>
      </div>
      {dose.instructions && (
        <p className="mt-5 text-[24px]">
          <span className="font-semibold">{t(lang, "instructions")}:</span> {dose.instructions}
        </p>
      )}

      <div className="mt-6">
        <ReadAloud text={speech} lang={SPEECH_LANG[lang]} label={t(lang, "readAloud")} stopLabel={t(lang, "stopReading")} missingLabel={t(lang, "voiceMissing")} />
      </div>

      {readOnly ? (
        helperLine && <p className="mt-8 rounded-xl bg-[#EEF4F1] p-5 text-[26px] font-medium text-primary">{helperLine}</p>
      ) : stage === "main" ? (
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <button type="button" className="btn-primary min-h-20 text-[28px]" disabled={busy} onClick={() => mark("taken")}>
            ✓ {t(lang, "tookIt")}
          </button>
          <button type="button" className="btn-secondary min-h-20 text-[28px]" disabled={busy} onClick={() => setStage("reasons")}>
            {t(lang, "notNow")}
          </button>
        </div>
      ) : (
        <fieldset className="mt-8">
          <legend className="text-[26px] font-semibold">{t(lang, "whyNot")}</legend>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {MISS_REASONS.map((r) => (
              <button key={r} type="button" className="btn-secondary min-h-16 text-[22px]" disabled={busy} onClick={() => mark("skipped", r)}>
                {t(lang, r)}
              </button>
            ))}
            <button type="button" className="btn-ghost min-h-16 text-[22px]" onClick={() => setStage("main")}>
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
    <li className="card p-6">
      <p className="text-[24px] font-semibold">{line}</p>
      <p className="mt-2 text-[22px]">{detail}</p>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <button type="button" className="btn-primary min-h-16 text-[24px]" disabled={busy} onClick={() => decide("approve")}>
          {t(lang, "approve")}
        </button>
        <button type="button" className="btn-secondary min-h-16 text-[24px]" disabled={busy} onClick={() => decide("decline")}>
          {t(lang, "askDoctor")}
        </button>
      </div>
      <p role="alert" className="mt-2 text-[22px] text-danger">
        {error}
      </p>
    </li>
  );
}
