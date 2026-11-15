"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { MISS_REASONS } from "@/lib/engine/types";
import { post } from "./client-api";

const REASON_LABEL: Record<string, string> = {
  ran_out: "Ran out",
  side_effect: "Side effect",
  forgot: "Forgot",
  chose_to_skip: "She chose to skip",
  not_feeling_well: "Not feeling well",
};

function Status({ msg, err }: { msg: string | null; err: string | null }) {
  return (
    <>
      <p aria-live="polite" className="text-sm font-medium text-success">
        {msg}
      </p>
      <p role="alert" className="text-sm font-medium text-danger">
        {err}
      </p>
    </>
  );
}

export function MarkDose({ doseId, label }: { doseId: string; label: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [reason, setReason] = useState<string>("");
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  async function mark(status: "taken" | "skipped") {
    setBusy(true);
    setErr(null);
    const { ok, data } = await post<{ note?: string }>("/api/doses/mark", { doseEventId: doseId, status, reason: status === "skipped" ? reason || null : null });
    setBusy(false);
    if (!ok) return setErr(data.error ?? "Could not save.");
    setMsg(data.note ?? "Saved.");
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-2 sm:items-end">
      <div className="flex flex-wrap gap-2">
        <button type="button" className="btn-primary min-h-11 px-4 text-sm" disabled={busy} onClick={() => mark("taken")} aria-label={`Mark ${label} as taken`}>
          Mark taken
        </button>
        <label className="sr-only" htmlFor={`r-${doseId}`}>
          Reason for skipping {label}
        </label>
        <select id={`r-${doseId}`} value={reason} onChange={(e) => setReason(e.target.value)} className="min-h-11 rounded-lg border border-[#C9C2B8] bg-surface px-2 text-sm">
          <option value="">Skip reason…</option>
          {MISS_REASONS.map((r) => (
            <option key={r} value={r}>
              {REASON_LABEL[r]}
            </option>
          ))}
        </select>
        <button type="button" className="btn-secondary min-h-11 px-4 text-sm" disabled={busy || !reason} onClick={() => mark("skipped")} aria-label={`Mark ${label} as skipped`}>
          Skip
        </button>
      </div>
      <Status msg={msg} err={err} />
    </div>
  );
}

export function ProposalDecision({ id }: { id: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  async function decide(decision: "approve" | "decline") {
    setBusy(true);
    const { ok, data } = await post(`/api/proposals/${id}`, { decision });
    setBusy(false);
    if (!ok) return setErr(data.error ?? "Could not save.");
    router.refresh();
  }
  return (
    <div className="flex flex-wrap gap-2">
      <button type="button" className="btn-primary min-h-11 px-4 text-sm" disabled={busy} onClick={() => decide("approve")}>
        Approve change
      </button>
      <button type="button" className="btn-secondary min-h-11 px-4 text-sm" disabled={busy} onClick={() => decide("decline")}>
        Decline change
      </button>
      <Status msg={null} err={err} />
    </div>
  );
}

export interface MedValues {
  id: string | null;
  name: string;
  doseText: string;
  times: string[];
  pillLook: string;
  instructions: string;
  stockCount: number;
  isCritical: boolean;
}

const FLOW_MSG: Record<string, (approver: string) => string> = {
  apply_now: () => "Saved.",
  needs_elder_approval: (a) => `Sent to ${a} to approve.`,
  needs_decision_partner: (a) => `Sent to ${a} to approve.`,
};

export function MedicineForm({ elderId, initial, approver, flowHint, canRemove }: { elderId: string; initial: MedValues | null; approver: string; flowHint: string; canRemove: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const idp = initial?.id ?? "new";

  async function send(medicine: Record<string, unknown>, doctorInstruction: boolean) {
    setBusy(true);
    setErr(null);
    setMsg(null);
    const { ok, data } = await post<{ flow?: string; issues?: { message: string }[] }>("/api/medicines", {
      elderId,
      medicineId: initial?.id ?? null,
      medicine,
      doctorInstruction,
    });
    setBusy(false);
    if (!ok) return setErr(data.issues?.map((i) => i.message).join(" ") || data.error || "Could not save.");
    setMsg(FLOW_MSG[data.flow ?? "apply_now"](approver));
    router.refresh();
  }

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const full = {
      name: String(f.get("name") ?? ""),
      doseText: String(f.get("doseText") ?? ""),
      times: String(f.get("times") ?? "")
        .split(/[,\s]+/)
        .filter(Boolean),
      pillLook: String(f.get("pillLook") ?? ""),
      instructions: String(f.get("instructions") ?? ""),
      stockCount: Number(f.get("stockCount")),
      isCritical: f.get("isCritical") === "on",
    };
    let medicine: Record<string, unknown> = full;
    if (initial) {
      // Send only what changed so the elder sees a clear, small request.
      medicine = Object.fromEntries(
        Object.entries(full).filter(([k, v]) => JSON.stringify(v) !== JSON.stringify(initial[k as keyof MedValues])),
      );
      if (!Object.keys(medicine).length) return setMsg("Nothing changed.");
    }
    send(medicine, f.get("doctor") === "on");
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-3 sm:grid-cols-2" noValidate>
      <label className="field">
        Name
        <input name="name" required maxLength={80} defaultValue={initial?.name} autoComplete="off" />
      </label>
      <label className="field">
        Dose
        <input name="doseText" required maxLength={60} defaultValue={initial?.doseText} placeholder="500 mg, 1 tablet" autoComplete="off" />
      </label>
      <label className="field">
        Times (24-hour, comma separated)
        <input name="times" required defaultValue={initial?.times.join(", ")} placeholder="08:00, 20:00" inputMode="numeric" autoComplete="off" aria-describedby={`times-h-${idp}`} />
        <span id={`times-h-${idp}`} className="text-xs font-normal text-muted">
          Example: 08:00, 20:00
        </span>
      </label>
      <label className="field">
        Pill look
        <input name="pillLook" required maxLength={40} defaultValue={initial?.pillLook} placeholder="pink round" autoComplete="off" />
      </label>
      <label className="field sm:col-span-2">
        How to take it
        <input name="instructions" maxLength={300} defaultValue={initial?.instructions} placeholder="After food" autoComplete="off" />
      </label>
      <label className="field">
        Tablets in stock
        <input name="stockCount" type="number" min={0} max={10000} required defaultValue={initial?.stockCount ?? 30} />
      </label>
      <div className="flex flex-col justify-end gap-2 text-sm">
        <label className="flex min-h-11 items-center gap-2">
          <input type="checkbox" name="isCritical" defaultChecked={initial?.isCritical} className="size-5" /> Critical (never skip quietly)
        </label>
        <label className="flex min-h-11 items-center gap-2">
          <input type="checkbox" name="doctor" className="size-5" /> This is the doctor&apos;s instruction
        </label>
      </div>
      <p className="text-sm text-muted sm:col-span-2">{flowHint}</p>
      <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
        <button type="submit" className="btn-primary" disabled={busy}>
          {initial ? "Save medicine" : "Add medicine"}
        </button>
        {initial && canRemove && (
          <button type="button" className="btn-danger" disabled={busy} onClick={() => send({ active: false }, false)}>
            Stop medicine
          </button>
        )}
      </div>
      <div className="sm:col-span-2">
        <Status msg={msg} err={err} />
      </div>
    </form>
  );
}

export function AppointmentForm({ elderId }: { elderId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    const local = String(f.get("startsAt") ?? "");
    setBusy(true);
    setErr(null);
    const { ok, data } = await post<{ issues?: { message: string }[] }>("/api/appointments", {
      elderId,
      appointment: {
        doctorName: f.get("doctorName"),
        specialty: f.get("specialty"),
        location: f.get("location"),
        startsAt: local ? `${local}:00+05:30` : "",
        notes: f.get("notes"),
      },
    });
    setBusy(false);
    if (!ok) return setErr(data.issues?.map((i) => i.message).join(" ") || data.error || "Could not save.");
    setMsg("Appointment added.");
    form.reset();
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-3 sm:grid-cols-2" noValidate>
      <label className="field">
        Doctor
        <input name="doctorName" required maxLength={80} autoComplete="off" />
      </label>
      <label className="field">
        Speciality
        <input name="specialty" maxLength={80} autoComplete="off" />
      </label>
      <label className="field">
        Date and time (IST)
        <input name="startsAt" type="datetime-local" required />
      </label>
      <label className="field">
        Place
        <input name="location" maxLength={160} autoComplete="off" />
      </label>
      <label className="field sm:col-span-2">
        Notes
        <input name="notes" maxLength={500} autoComplete="off" />
      </label>
      <div className="sm:col-span-2">
        <button type="submit" className="btn-primary" disabled={busy}>
          Add appointment
        </button>
        <Status msg={msg} err={err} />
      </div>
    </form>
  );
}

export function RemoveAppointment({ elderId, id, label }: { elderId: string; id: string; label: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <button
      type="button"
      className="btn-ghost text-sm text-danger"
      disabled={busy}
      aria-label={`Remove appointment: ${label}`}
      onClick={async () => {
        if (!confirm(`Remove the appointment with ${label}?`)) return;
        setBusy(true);
        await post("/api/appointments", { elderId, appointmentId: id }, "DELETE");
        router.refresh();
      }}
    >
      Remove
    </button>
  );
}
