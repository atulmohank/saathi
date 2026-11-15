"use client";

import { useState } from "react";
import { post } from "./client-api";

interface Plain {
  source: "gemini" | "template";
  summary_en: string;
  questions_en: string[];
  summary_local: string;
  questions_local: string[];
  lang: string;
}

export function GeminiBrief({ appointmentId, langName, langCode }: { appointmentId: string; langName: string; langCode: string }) {
  const [busy, setBusy] = useState(false);
  const [b, setB] = useState<Plain | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function go() {
    setBusy(true);
    setErr(null);
    const { ok, data } = await post<Plain>("/api/brief", { appointmentId });
    setBusy(false);
    if (!ok) return setErr(data.error ?? "Could not write the brief.");
    setB(data);
  }

  return (
    <section aria-labelledby="plain-h" className="card p-6 print:border-black">
      <h2 id="plain-h" className="font-serif text-2xl">
        In plain language
      </h2>
      {!b && (
        <>
          <p className="mt-2 text-[#3D4A43]">
            Rewrite this brief in plain English{langCode !== "en" ? ` and ${langName}` : ""}. Only the facts above are sent; the
            template is used if anything goes wrong.
          </p>
          <button type="button" className="btn-primary no-print mt-4" onClick={go} disabled={busy}>
            {busy ? "Writing… (up to 25 seconds)" : `Write it with Google Gemini`}
          </button>
        </>
      )}
      <div aria-live="polite">
        {b && (
          <div className="mt-3">
            <p className={`badge text-xs ${b.source === "gemini" ? "bg-[#E4EFEA] text-primary" : "bg-[#F1ECE4] text-ink"}`}>
              {b.source === "gemini" ? "Generated with Google Gemini — check with the doctor" : "Gemini was unavailable; showing the standard brief"}
            </p>
            <p className="mt-3 whitespace-pre-line">{b.summary_en}</p>
            <h3 className="mt-4 font-semibold">Questions to ask</h3>
            <ul className="mt-1 list-disc pl-6">
              {b.questions_en.map((q) => (
                <li key={q}>{q}</li>
              ))}
            </ul>
            {b.summary_local && (
              <div lang={b.lang} className="mt-6 border-t border-[#E6DFD8] pt-4">
                <h3 className="font-semibold">
                  <span lang="en">{langName}</span>
                </h3>
                <p className="mt-2 whitespace-pre-line text-lg">{b.summary_local}</p>
                <ul className="mt-2 list-disc pl-6 text-lg">
                  {b.questions_local.map((q) => (
                    <li key={q}>{q}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
      <p role="alert" className="mt-2 text-danger">
        {err}
      </p>
    </section>
  );
}
