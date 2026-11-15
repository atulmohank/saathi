"use client";
import { PageShell } from "@/components/PageShell";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { post } from "@/components/client-api";

type Row = { displayName: string; email: string; role: string; passcode: string };
const ROLES = [
  { v: "family", l: "Family" },
  { v: "caretaker", l: "Caretaker" },
  { v: "decision_partner", l: "Decision partner" },
  { v: "elder", l: "The elder (their own sign-in)" },
];
const LANGS = [
  { v: "en", l: "English" },
  { v: "hi", l: "हिन्दी (Hindi)" },
  { v: "ta", l: "தமிழ் (Tamil)" },
  { v: "te", l: "తెలుగు (Telugu)" },
  { v: "kn", l: "ಕನ್ನಡ (Kannada)" },
  { v: "ml", l: "മലയാളം (Malayalam)" },
];
const list = (s: FormDataEntryValue | null) =>
  String(s ?? "")
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);

export default function CreateCirclePage() {
  const router = useRouter();
  const [rows, setRows] = useState<Row[]>([
    { displayName: "", email: "", role: "family", passcode: "" },
    { displayName: "", email: "", role: "elder", passcode: "" },
  ]);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [done, setDone] = useState<{ code: string; circleId: string; role: string } | null>(null);

  const setRow = (i: number, k: keyof Row, v: string) => setRows((r) => r.map((x, j) => (j === i ? { ...x, [k]: v } : x)));

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setBusy(true);
    setErrors([]);
    const { ok, data } = await post<{ code: string; circleId: string; role: string; issues?: { path: (string | number)[]; message: string }[] }>("/api/circles", {
      circleName: f.get("circleName"),
      elder: {
        displayName: f.get("elderName"),
        age: Number(f.get("age")),
        autonomyMode: f.get("mode"),
        preferredLanguage: f.get("lang"),
        emergency: {
          bloodGroup: f.get("blood") ?? "",
          allergies: list(f.get("allergies")),
          conditions: list(f.get("conditions")),
          doctorName: f.get("doctorName") ?? "",
          doctorPhone: f.get("doctorPhone") ?? "",
        },
      },
      members: rows.filter((r) => r.displayName.trim() || r.passcode),
    });
    setBusy(false);
    if (!ok) return setErrors(data.issues?.map((i) => `${i.path.join(" › ")}: ${i.message}`) ?? [data.error ?? "Could not create the circle."]);
    setDone(data);
  }

  if (done) {
    return (
      <PageShell>
      <main id="main" className="mx-auto w-full max-w-lg flex-1 px-4 py-12">
        <div className="card mt-6 p-8" role="status">
          <h1 className="font-serif text-3xl">Your care circle is ready</h1>
          <p className="mt-4">Share this circle code with everyone you added. They sign in with it and their own passcode.</p>
          <p className="mt-6 text-center font-mono text-5xl font-bold tracking-[0.3em] text-primary">{done.code}</p>
          <button type="button" className="btn-primary mt-8 w-full" onClick={() => router.push(done.role === "elder" ? `/circle/${done.circleId}/today` : `/circle/${done.circleId}`)}>
            Open the care circle
          </button>
        </div>
      </main>
      </PageShell>
    );
  }

  return (
    <PageShell>
    <main id="main" className="mx-auto w-full max-w-3xl flex-1 px-4 py-12">
      <h1 className="mt-6 font-serif text-4xl">Create your own care circle</h1>
      <p className="mt-3 text-[#3D4A43]">One circle per family. Each person gets their own passcode, stored only as a secure hash.</p>

      <form onSubmit={submit} className="mt-8 flex flex-col gap-8" noValidate>
        <fieldset className="card grid gap-4 p-6 sm:grid-cols-2">
          <legend className="px-1 font-serif text-2xl">The circle</legend>
          <label className="field sm:col-span-2">
            Circle name
            <input name="circleName" required maxLength={80} placeholder="Amma's care circle" autoComplete="off" />
          </label>
        </fieldset>

        <fieldset className="card grid gap-4 p-6 sm:grid-cols-2">
          <legend className="px-1 font-serif text-2xl">The elder</legend>
          <label className="field">
            Name
            <input name="elderName" required maxLength={60} autoComplete="off" />
          </label>
          <label className="field">
            Age
            <input name="age" type="number" min={40} max={120} required />
          </label>
          <label className="field">
            Care mode
            <select name="mode" defaultValue="independent">
              <option value="independent">Independent: uses a phone, approves every change</option>
              <option value="assisted">Assisted: a little forgetful; changes apply with a note</option>
              <option value="supported">Supported: caretaker marks doses; decision partner approves</option>
            </select>
          </label>
          <label className="field">
            Language for the elder&apos;s screen
            <select name="lang" defaultValue="en">
              {LANGS.map((l) => (
                <option key={l.v} value={l.v}>
                  {l.l}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            Blood group
            <select name="blood" defaultValue="">
              <option value="">Not known</option>
              {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((b) => (
                <option key={b}>{b}</option>
              ))}
            </select>
          </label>
          <label className="field">
            Allergies (comma separated)
            <input name="allergies" maxLength={600} placeholder="Penicillin, peanuts" autoComplete="off" />
          </label>
          <label className="field sm:col-span-2">
            Conditions (comma separated)
            <input name="conditions" maxLength={600} placeholder="Type 2 diabetes, hypertension" autoComplete="off" />
          </label>
          <label className="field">
            Doctor&apos;s name
            <input name="doctorName" maxLength={80} autoComplete="off" />
          </label>
          <label className="field">
            Doctor&apos;s phone
            <input name="doctorPhone" type="tel" maxLength={20} autoComplete="off" />
          </label>
        </fieldset>

        <fieldset className="card flex flex-col gap-4 p-6">
          <legend className="px-1 font-serif text-2xl">People in the circle</legend>
          <p className="text-sm text-muted">The first person is you; you&apos;ll be signed in after creating the circle. Passcodes are 4–8 digits.</p>
          {rows.map((r, i) => (
            <div key={i} className="grid gap-3 rounded-xl border border-[#E6DFD8] p-4 sm:grid-cols-4">
              <label className="field">
                {i === 0 ? "Your name" : "Name"}
                <input value={r.displayName} onChange={(e) => setRow(i, "displayName", e.target.value)} maxLength={60} autoComplete="off" />
              </label>
              <label className="field">
                Role
                <select value={r.role} onChange={(e) => setRow(i, "role", e.target.value)}>
                  {ROLES.map((x) => (
                    <option key={x.v} value={x.v}>
                      {x.l}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                Email (for reminders)
                <input type="email" spellCheck={false} value={r.email} onChange={(e) => setRow(i, "email", e.target.value)} maxLength={254} autoComplete="off" />
              </label>
              <label className="field">
                Passcode
                <input type="password" inputMode="numeric" value={r.passcode} onChange={(e) => setRow(i, "passcode", e.target.value)} maxLength={8} autoComplete="new-password" />
              </label>
              {i > 0 && (
                <button type="button" className="btn-ghost text-sm text-danger sm:col-span-4 sm:justify-self-end" onClick={() => setRows((rs) => rs.filter((_, j) => j !== i))}>
                  Remove this person
                </button>
              )}
            </div>
          ))}
          {rows.length < 10 && (
            <button type="button" className="btn-secondary self-start" onClick={() => setRows((rs) => [...rs, { displayName: "", email: "", role: "caretaker", passcode: "" }])}>
              Add another person
            </button>
          )}
        </fieldset>

        <div aria-live="assertive">
          {errors.length > 0 && (
            <ul role="alert" className="list-disc rounded-xl border-2 border-danger bg-[#FBEDEC] p-4 pl-8 text-danger">
              {errors.map((er) => (
                <li key={er}>{er}</li>
              ))}
            </ul>
          )}
        </div>
        <button type="submit" className="btn-primary self-start" disabled={busy}>
          {busy ? "Creating…" : "Create care circle"}
        </button>
      </form>
    </main>
    </PageShell>
  );
}
