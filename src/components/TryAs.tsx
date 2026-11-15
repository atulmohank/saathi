"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { post } from "./client-api";

export interface PersonaCard {
  id: "kamala" | "priya" | "lakshmi" | "joseph" | "ravi";
  name: string;
  blurb: string;
  detail: string;
  initial: string;
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
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5" role="list">
        {personas.map((p) => (
          <li key={p.id}>
            <button
              type="button"
              onClick={() => go(p)}
              disabled={busy !== null}
              className="card-link group flex h-full w-full flex-col items-start gap-3 p-5 text-left"
              aria-label={`Try the demo as ${p.name}, ${p.blurb}`}
            >
              <span aria-hidden="true" className="grid size-12 place-items-center rounded-full bg-primary font-serif text-xl text-white">
                {p.initial}
              </span>
              <span className="font-serif text-xl">{p.name}</span>
              <span className="text-sm font-medium text-primary">{p.blurb}</span>
              <span className="text-sm text-muted">{p.detail}</span>
              <span className="mt-auto pt-2 text-sm font-semibold text-primary underline-offset-4 group-hover:underline">
                {busy === p.id ? "Opening…" : `Continue as ${p.name.split(" ").pop()} →`}
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
