import { fmtDateTime } from "@/lib/data";
import type { AdherenceResult } from "@/lib/engine/adherence";

/** Four coloured tiles under the header: 7-day adherence (both numbers), today's progress, next doctor visit. */
export function StatTiles({
  elderName,
  adherence,
  todayTaken,
  todayTotal,
  nextAppt,
}: {
  elderName: string;
  adherence: AdherenceResult;
  todayTaken: number;
  todayTotal: number;
  nextAppt: { doctor_name: string; starts_at: string } | undefined;
}) {
  return (
    <section aria-label={`${elderName} at a glance`}>
      <dl className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-[28px] bg-[linear-gradient(160deg,#FFFDF9_0%,#E7EFE9_100%)] p-5 shadow-[var(--lift-2)] sm:p-6">
          <dt className="text-sm font-medium text-ink-soft">Taken, last 7 days</dt>
          <dd className="mt-2 font-serif text-[2.5rem] font-semibold leading-none text-primary">{adherence.overallRate ?? "–"}%</dd>
        </div>
        <div className="rounded-[28px] bg-[linear-gradient(160deg,#FFFDF9_0%,#F6E3D3_100%)] p-5 shadow-[var(--lift-2)] sm:p-6">
          <dt className="text-sm font-medium text-ink-soft">Not counting {elderName}&apos;s own choices</dt>
          <dd className="mt-2 font-serif text-[2.5rem] font-semibold leading-none text-[#9A4F2A]">{adherence.rateExcludingChoices ?? "–"}%</dd>
        </div>
        <div className="rounded-[28px] bg-[linear-gradient(160deg,#FFFDF9_0%,#FBEACB_100%)] p-5 shadow-[var(--lift-2)] sm:p-6">
          <dt className="text-sm font-medium text-ink-soft">Today</dt>
          <dd className="mt-2 font-serif text-[2.5rem] font-semibold leading-none text-saffron-ink">
            {todayTaken}
            <span className="text-xl text-ink-soft"> of {todayTotal} taken</span>
          </dd>
        </div>
        <div className="rounded-[28px] bg-paper p-5 shadow-[var(--lift-2)] sm:p-6">
          <dt className="text-sm font-medium text-ink-soft">Next doctor visit</dt>
          <dd className="mt-2 text-lg font-semibold leading-snug text-ink">
            {nextAppt ? (
              <>
                {nextAppt.doctor_name}
                <span className="block text-sm font-normal text-ink-soft">{fmtDateTime(nextAppt.starts_at)}</span>
              </>
            ) : (
              "None booked"
            )}
          </dd>
        </div>
      </dl>
    </section>
  );
}
