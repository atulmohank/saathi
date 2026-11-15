import type { DisplayStatus } from "@/lib/data";
import { PillboxFill } from "./motion";

/** PillboxFill draws at ≥48px; these classes let it scale down to fit seven columns on a phone. */
const FIT = "mx-auto block w-full max-w-14 [&_span]:!block [&_svg]:!h-auto [&_svg]:!w-full";

type Cell = { slot: "morning" | "noon" | "night"; doses: { id: string; display: DisplayStatus; medName: string; reason: string | null }[] };
type Day = { day: string; label: string; short: string; slots: Cell[] };

const SLOT_LABEL = { morning: "Morning", noon: "Noon", night: "Night" } as const;

function cellState(c: Cell): "empty" | "taken" | "missed" | "skipped" | "upcoming" {
  if (!c.doses.length) return "empty";
  if (c.doses.some((d) => d.display === "missed")) return "missed";
  if (c.doses.some((d) => d.display === "skipped")) return "skipped";
  if (c.doses.every((d) => d.display === "taken")) return "taken";
  return "upcoming";
}

const WORD = { empty: "no medicines", taken: "all taken", missed: "missed", skipped: "skipped", upcoming: "upcoming" } as const;

/** Signature visual: 7 days × Morning / Noon / Night compartments. */
export function Pillbox({ days, today }: { days: Day[]; today: string }) {
  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full table-fixed border-separate border-spacing-1 sm:border-spacing-1.5 text-center">
          <caption className="sr-only">Seven-day pillbox. Each compartment shows whether that time&apos;s medicines were taken.</caption>
          <thead>
            <tr>
              <th scope="col" className="w-14 sm:w-20">
                <span className="sr-only">Time of day</span>
              </th>
              {days.map((d) => (
                <th key={d.day} scope="col" className={`text-xs sm:text-sm font-semibold ${d.day === today ? "text-primary" : "text-muted"}`}>
                  <span className="sm:hidden" aria-hidden="true">
                    {d.short}
                  </span>
                  <span className="max-sm:sr-only">{d.label}</span>
                  {d.day === today && <span className="block text-xs">Today</span>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(["morning", "noon", "night"] as const).map((slot) => (
              <tr key={slot}>
                <th scope="row" className="text-left text-xs sm:text-sm font-semibold text-muted">
                  {SLOT_LABEL[slot]}
                </th>
                {days.map((d) => {
                  const c = d.slots.find((s) => s.slot === slot)!;
                  const st = cellState(c);
                  const detail = c.doses.map((x) => `${x.medName} ${x.display}${x.reason ? ` (${x.reason.replace(/_/g, " ")})` : ""}`).join(", ");
                  return (
                    <td key={d.day} className="p-0">
                      {st === "empty" ? (
                        <div
                          tabIndex={0}
                          role="img"
                          aria-label={`${d.label} ${SLOT_LABEL[slot]}: no medicines`}
                          className="mx-auto aspect-square w-full max-w-14 rounded-lg border border-dashed border-[#D8D1C6] sm:rounded-xl"
                        />
                      ) : (
                        <div tabIndex={0} title={detail || undefined} className={`${FIT} rounded-xl`}>
                          <PillboxFill status={st} label={`${d.label} ${SLOT_LABEL[slot]}: ${WORD[st]}${detail ? `. ${detail}` : ""}`} />
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm" aria-label="Legend" role="list">
        {(["taken", "upcoming", "skipped", "missed"] as const).map((s) => (
          <li key={s} className="flex items-center gap-2">
            <span aria-hidden="true" className="block w-7 [&_span]:!block [&_svg]:!h-auto [&_svg]:!w-full">
              <PillboxFill status={s} label="" />
            </span>
            {s === "skipped" ? "Skipped, with a reason" : s[0].toUpperCase() + s.slice(1)}
          </li>
        ))}
      </ul>
    </div>
  );
}
