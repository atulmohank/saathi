"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { post } from "./client-api";

export interface PanelMember {
  id: string;
  name: string;
  role: string;
  roleLabel: string;
  email: string | null;
  onDuty: boolean;
}

export function MembersPanel({ elderId, members, meId, canManage }: { elderId: string; members: PanelMember[]; meId: string; canManage: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  async function toggle(m: PanelMember) {
    setBusy(m.id);
    setErr(null);
    const res = await fetch("/api/members", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ elderId, memberId: m.id, onDuty: !m.onDuty }) });
    const data = await res.json().catch(() => ({}));
    setBusy(null);
    if (!res.ok) return setErr(data.error ?? "Could not change duty.");
    setMsg(`${m.name} is now ${m.onDuty ? "off" : "on"} duty.`);
    router.refresh();
  }

  async function add(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    setBusy("add");
    setErr(null);
    const { ok, data } = await post<{ issues?: { message: string }[] }>("/api/members", {
      elderId,
      member: { displayName: f.get("name"), email: f.get("email"), role: f.get("role"), passcode: f.get("passcode") },
    });
    setBusy(null);
    if (!ok) return setErr(data.issues?.map((i) => i.message).join(" ") || data.error || "Could not add.");
    setMsg("Member added. Share the circle code with them.");
    form.reset();
    router.refresh();
  }

  return (
    <div>
      <ul className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3" role="list">
        {members.map((m) => {
          const canToggle = m.role === "caretaker" && (canManage || m.id === meId);
          return (
            <li key={m.id} className="card flex items-center justify-between gap-3 p-3">
              <div className="min-w-0">
                <p className="font-semibold">
                  {m.name}
                  {m.id === meId && <span className="font-normal text-muted"> (you)</span>}
                </p>
                <p className="text-sm text-muted">{m.roleLabel}</p>
              </div>
              {m.role === "caretaker" &&
                (canToggle ? (
                  <button
                    type="button"
                    aria-pressed={m.onDuty}
                    disabled={busy !== null}
                    onClick={() => toggle(m)}
                    className={`inline-flex min-h-11 items-center gap-2 rounded-full border-2 px-3 text-sm font-semibold ${m.onDuty ? "border-success bg-[#E4F1E8] text-success" : "border-[#C9C2B8] bg-surface text-muted"}`}
                    aria-label={`${m.name} on duty`}
                  >
                    <span aria-hidden="true" className={`size-3 rounded-full ${m.onDuty ? "bg-success" : "bg-[#C9C2B8]"}`} />
                    {m.onDuty ? "On duty" : "Off duty"}
                  </button>
                ) : (
                  <span className={`badge text-xs ${m.onDuty ? "bg-[#E4F1E8] text-success" : "bg-[#F1ECE4] text-muted"}`}>{m.onDuty ? "On duty" : "Off duty"}</span>
                ))}
            </li>
          );
        })}
      </ul>
      <p className="mt-2 text-sm text-muted">Missed-dose emails for the caretaker go to whoever is on duty (all caretakers if nobody is).</p>
      <p aria-live="polite" className="mt-1 text-sm font-medium text-success">
        {msg}
      </p>
      <p role="alert" className="text-sm font-medium text-danger">
        {err}
      </p>
      {canManage && (
        <details className="card mt-3 p-4">
          <summary className="min-h-11 cursor-pointer content-center font-semibold text-primary">Add a person</summary>
          <form onSubmit={add} className="mt-3 grid gap-3 sm:grid-cols-4" noValidate>
            <label className="field">
              Name
              <input name="name" required maxLength={60} autoComplete="off" />
            </label>
            <label className="field">
              Role
              <select name="role" defaultValue="family">
                <option value="family">Family</option>
                <option value="caretaker">Caretaker</option>
                <option value="decision_partner">Decision partner</option>
              </select>
            </label>
            <label className="field">
              Email
              <input name="email" type="email" maxLength={254} autoComplete="off" />
            </label>
            <label className="field">
              Their passcode
              <input name="passcode" type="password" inputMode="numeric" maxLength={8} autoComplete="new-password" />
            </label>
            <div className="sm:col-span-4">
              <button type="submit" className="btn-primary" disabled={busy !== null}>
                Add person
              </button>
            </div>
          </form>
        </details>
      )}
    </div>
  );
}
