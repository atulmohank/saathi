"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { post } from "@/components/client-api";

type M = { id: string; name: string; role: string };
const ROLE: Record<string, string> = { elder: "Elder", caretaker: "Caretaker", family: "Family", decision_partner: "Decision partner" };

export default function SignInPage() {
  const router = useRouter();
  const [circle, setCircle] = useState<{ name: string; members: M[] } | null>(null);
  const [memberId, setMemberId] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function findCircle(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const code = String(new FormData(e.currentTarget).get("code") ?? "");
    setBusy(true);
    setErr(null);
    const { ok, data } = await post<{ circleName: string; members: M[]; issues?: { message: string }[] }>("/api/auth/circle", { code });
    setBusy(false);
    if (!ok) return setErr(data.issues?.[0]?.message ?? data.error ?? "Could not find that circle.");
    setCircle({ name: data.circleName, members: data.members });
    setMemberId(data.members[0]?.id ?? "");
  }

  async function signIn(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const passcode = String(new FormData(e.currentTarget).get("passcode") ?? "");
    setBusy(true);
    setErr(null);
    const { ok, data } = await post<{ circleId: string; role: string; issues?: { message: string }[] }>("/api/auth/login", { memberId, passcode });
    setBusy(false);
    if (!ok) return setErr(data.issues?.[0]?.message ?? data.error ?? "That passcode didn't work.");
    router.push(data.role === "elder" ? `/circle/${data.circleId}/today` : `/circle/${data.circleId}`);
  }

  return (
    <main id="main" className="mx-auto w-full max-w-lg flex-1 px-4 py-12">
      <Link href="/" className="font-serif text-2xl text-primary">
        Saathi
      </Link>
      <h1 className="mt-6 font-serif text-4xl">Sign in with your passcode</h1>
      <p className="mt-3 text-[#3D4A43]">
        Trying the demo? Circle code <strong>DEMO</strong>, passcode <strong>1234</strong> for everyone.
      </p>

      {!circle ? (
        <form onSubmit={findCircle} className="card mt-8 flex flex-col gap-4 p-6" noValidate>
          <label className="field text-base">
            Circle code
            <input name="code" required autoComplete="off" autoCapitalize="characters" spellCheck={false} maxLength={8} className="uppercase tracking-widest" />
          </label>
          <button type="submit" className="btn-primary" disabled={busy}>
            {busy ? "Looking…" : "Find my circle"}
          </button>
        </form>
      ) : (
        <form onSubmit={signIn} className="card mt-8 flex flex-col gap-4 p-6" noValidate>
          <p className="font-semibold">{circle.name}</p>
          <fieldset>
            <legend className="text-sm font-medium">Who are you?</legend>
            <div className="mt-2 grid gap-2">
              {circle.members.map((m) => (
                <label key={m.id} className={`flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border-2 px-4 ${memberId === m.id ? "border-primary bg-[#EEF4F1]" : "border-[#E6DFD8]"}`}>
                  <input type="radio" name="member" value={m.id} checked={memberId === m.id} onChange={() => setMemberId(m.id)} className="size-5" />
                  <span className="font-medium">{m.name}</span>
                  <span className="text-sm text-muted">{ROLE[m.role] ?? m.role}</span>
                </label>
              ))}
            </div>
          </fieldset>
          <label className="field text-base">
            Passcode
            <input name="passcode" type="password" inputMode="numeric" autoComplete="current-password" required maxLength={8} />
          </label>
          <button type="submit" className="btn-primary" disabled={busy || !memberId}>
            {busy ? "Signing in…" : "Sign in"}
          </button>
          <button type="button" className="btn-ghost self-start" onClick={() => setCircle(null)}>
            Use a different circle code
          </button>
        </form>
      )}
      <p role="alert" className="mt-4 font-medium text-danger">
        {err}
      </p>
      <p className="mt-6 text-sm text-muted">
        After 5 wrong passcodes, sign-in is paused for 15 minutes. New here?{" "}
        <Link href="/create" className="font-semibold text-primary underline">
          Create your own care circle
        </Link>
      </p>
    </main>
  );
}
