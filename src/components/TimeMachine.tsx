"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { post } from "./client-api";

const BUTTONS = [
  { action: "kamala_missed_8am", label: "Simulate: Kamala missed 8 AM", hint: "Independent ladder: Kamala → caretaker → family" },
  { action: "joseph_missed_1pm", label: "Simulate: Joseph missed 1 PM", hint: "Supported ladder: caretaker → Ravi + family" },
  { action: "run_scheduler", label: "Run scheduler now", hint: "Same job cron runs every 5 minutes" },
  { action: "reset", label: "Reset demo", hint: "Fresh fictional data" },
] as const;

export function TimeMachineControls() {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function run(action: string) {
    if (action === "reset" && !confirm("Reset the demo to fresh data?")) return;
    setBusy(action);
    setErr(null);
    setMsg(null);
    const { ok, data } = await post<{ message?: string; circleId?: string }>("/api/demo", { action });
    setBusy(null);
    if (!ok) return setErr(data.error ?? "Something went wrong.");
    setMsg(data.message ?? "Done.");
    if (action === "reset" && data.circleId) router.push(`/circle/${data.circleId}`);
    router.refresh();
  }

  return (
    <div>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4" role="list">
        {BUTTONS.map((b) => (
          <li key={b.action}>
            <button
              type="button"
              disabled={busy !== null}
              onClick={() => run(b.action)}
              aria-describedby={`tm-${b.action}`}
              className={`${b.action === "reset" ? "btn-secondary" : "btn-primary"} h-full w-full flex-col py-3 text-left`}
            >
              <span>{busy === b.action ? "Working… (sending emails)" : b.label}</span>
              <span id={`tm-${b.action}`} className="text-xs font-normal opacity-90">
                {b.hint}
              </span>
            </button>
          </li>
        ))}
      </ul>
      <p aria-live="polite" className="mt-3 text-sm font-medium text-success">
        {msg}
      </p>
      <p role="alert" className="text-sm font-medium text-danger">
        {err}
      </p>
    </div>
  );
}
