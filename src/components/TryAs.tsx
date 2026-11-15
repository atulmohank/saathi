"use client";

/* eslint-disable @next/next/no-img-element -- fixed-crop persona photos */
import { useRouter } from "next/navigation";
import { useState } from "react";
import { post } from "./client-api";

export interface PersonaCard {
  id: "kamala" | "priya" | "lakshmi" | "joseph" | "ravi";
  name: string;
  blurb: string;
  detail: string;
  photo: string;
  alt: string;
  /** Role band colour. */
  band: string;
  role: string;
}

export function TryAs({ personas }: { personas: PersonaCard[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function go(p: PersonaCard) {
    setBusy(p.id);
    setError(null);
    const { ok, data } = await post<{ circleId: string; role: string }>("/api/auth/demo", { persona: p.id });
    if (!ok) {
      setError(data.error ?? "Could not start the demo.");
      setBusy(null);
      return;
    }
    router.push(data.role === "elder" ? `/circle/${data.circleId}/today` : `/circle/${data.circleId}`);
  }

  return (
    <>
      <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-5" role="list">
        {personas.map((p) => (
          <li key={p.id}>
            <button
              type="button"
              onClick={() => go(p)}
              disabled={busy !== null}
              className="card-link group flex h-full w-full flex-col overflow-hidden text-left"
              aria-labelledby={`p-${p.id}-n p-${p.id}-b`}
              aria-describedby={`p-${p.id}-d`}
            >
              <span className="relative block aspect-[4/3] w-full overflow-hidden sm:aspect-[4/5]">
                <img src={p.photo} alt={p.alt} width={800} height={1000} loading="lazy" className="h-full w-full object-cover object-[50%_25%] transition-transform duration-500 group-hover:scale-[1.03]" />
                <span className="absolute left-3 top-3 rounded-full bg-paper/90 px-2.5 py-1 text-[11px] font-semibold text-ink-soft backdrop-blur">Demo persona</span>
                <span aria-hidden="true" className={`absolute inset-x-0 bottom-0 h-1.5 ${p.band}`} />
              </span>
              <span className="flex flex-1 flex-col gap-1.5 p-5">
                <span className="text-xs font-semibold text-muted">{p.role}</span>
                <span id={`p-${p.id}-n`} className="font-serif text-2xl font-semibold leading-tight text-ink">
                  {p.name}
                </span>
                <span id={`p-${p.id}-b`} className="text-sm font-semibold text-primary">
                  {p.blurb}
                </span>
                <span id={`p-${p.id}-d`} className="text-sm text-ink-soft">
                  {p.detail}
                </span>
                <span className="mt-auto pt-3 text-sm font-semibold text-primary underline-offset-4 group-hover:underline">
                  {busy === p.id ? "Opening…" : `Continue as ${p.name.split(" ").pop()}`}
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>
      <p role="alert" aria-live="assertive" className="mt-3 text-danger">
        {error}
      </p>
    </>
  );
}
