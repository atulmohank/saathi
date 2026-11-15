import { describe, expect, it } from "vitest";
import { checkDoubleDose, type DoseLog } from "../doseGuard";
import { forecastRefill } from "../stock";
import { adherenceRate, type AdherenceLog } from "../adherence";
import { expandSchedule, slotOf, istDate } from "../schedule";

// 08:00 IST on 2026-11-15 = 02:30 UTC
const at = (iso: string) => new Date(iso);

describe("checkDoubleDose", () => {
  const logs: DoseLog[] = [
    { id: "d1", medicineId: "m1", scheduledAt: at("2026-11-15T02:30:00Z"), status: "taken", markedAt: at("2026-11-15T02:32:00Z"), markedByName: "Ravi" },
    { id: "d2", medicineId: "m1", scheduledAt: at("2026-11-15T14:30:00Z"), status: "pending", markedAt: null, markedByName: null },
    { id: "d3", medicineId: "m2", scheduledAt: at("2026-11-15T02:30:00Z"), status: "pending", markedAt: null, markedByName: null },
    { id: "d4", medicineId: "m3", scheduledAt: at("2026-11-15T02:30:00Z"), status: "taken", markedAt: null, markedByName: null },
    { id: "d5", medicineId: "m1", scheduledAt: at("2026-11-15T04:00:00Z"), status: "pending", markedAt: null, markedByName: null },
  ];
  const cases: [string, string, string, boolean, string][] = [
    ["already taken shows time and who", "d1", "2026-11-15T03:00:00Z", true, "Already taken at 8:02 AM, marked by Ravi."],
    ["taken without details", "d4", "2026-11-15T03:00:00Z", true, "Already taken at earlier."],
    ["too early (8 PM dose at 8:30 AM)", "d2", "2026-11-15T03:00:00Z", true, "This dose is not due until 8:00 PM."],
    ["pending, on time", "d3", "2026-11-15T02:35:00Z", false, "OK"],
    ["same medicine taken 30 min ago", "d5", "2026-11-15T03:02:00Z", true, "This medicine was already taken at 8:02 AM, marked by Ravi."],
    ["same medicine taken long ago is fine", "d5", "2026-11-15T05:00:00Z", false, "OK"],
    ["unknown dose", "zzz", "2026-11-15T03:00:00Z", true, "This dose could not be found."],
  ];
  it.each(cases)("%s", (_n, id, now, blocked, message) => {
    expect(checkDoubleDose(logs, id, at(now))).toEqual({ blocked, message });
  });
});

describe("forecastRefill", () => {
  it.each([
    [30, 2, 15, false],
    [6, 2, 3, true],
    [7, 2, 3, true],
    [8, 2, 4, false],
    [0, 1, 0, true],
    [-5, 1, 0, true],
    [10, 0, Infinity, false],
    [3, 3, 1, true],
  ])("stock %i, %i/day → %i days, refill=%s", (stock, perDay, daysLeft, needsRefill) => {
    expect(forecastRefill(stock, perDay)).toEqual({ daysLeft, needsRefill });
  });
});

describe("adherenceRate", () => {
  const d = (day: number, status: AdherenceLog["status"], reason: string | null = null): AdherenceLog => ({
    scheduledAt: at(`2026-11-${String(day).padStart(2, "0")}T03:00:00Z`),
    status,
    reason,
  });
  const win = { from: at("2026-11-09T00:00:00Z"), to: at("2026-11-16T00:00:00Z") };
  it.each([
    ["empty", [], { taken: 0, missed: 0, choseToSkip: 0, skippedOther: 0, overallRate: null, rateExcludingChoices: null }],
    ["all taken", [d(10, "taken"), d(11, "taken")], { taken: 2, missed: 0, choseToSkip: 0, skippedOther: 0, overallRate: 100, rateExcludingChoices: 100 }],
    [
      "her choice is not counted as failure in second number",
      [d(10, "taken"), d(11, "taken"), d(12, "taken"), d(13, "skipped", "chose_to_skip")],
      { taken: 3, missed: 0, choseToSkip: 1, skippedOther: 0, overallRate: 75, rateExcludingChoices: 100 },
    ],
    [
      "missed + other skip count against both",
      [d(10, "taken"), d(11, "missed"), d(12, "skipped", "ran_out"), d(13, "skipped", "chose_to_skip")],
      { taken: 1, missed: 1, choseToSkip: 1, skippedOther: 1, overallRate: 25, rateExcludingChoices: 33.3 },
    ],
    ["pending ignored", [d(10, "taken"), d(15, "pending")], { taken: 1, missed: 0, choseToSkip: 0, skippedOther: 0, overallRate: 100, rateExcludingChoices: 100 }],
    ["outside window ignored", [d(1, "missed"), d(10, "taken")], { taken: 1, missed: 0, choseToSkip: 0, skippedOther: 0, overallRate: 100, rateExcludingChoices: 100 }],
    ["only own choices", [d(10, "skipped", "chose_to_skip")], { taken: 0, missed: 0, choseToSkip: 1, skippedOther: 0, overallRate: 0, rateExcludingChoices: null }],
  ] as [string, AdherenceLog[], object][])("%s", (_n, logs, expected) => {
    expect(adherenceRate(logs, win)).toEqual(expected);
  });
});

describe("expandSchedule (IST)", () => {
  it("expands times across days, sorted, in UTC instants", () => {
    const r = expandSchedule([{ id: "m1", times: ["20:00", "08:00"], active: true }], "2026-11-15", "2026-11-16");
    expect(r.map((x) => x.scheduledAt.toISOString())).toEqual([
      "2026-11-15T02:30:00.000Z",
      "2026-11-15T14:30:00.000Z",
      "2026-11-16T02:30:00.000Z",
      "2026-11-16T14:30:00.000Z",
    ]);
  });

  it("handles IST midnight: 00:15 and 23:45 IST land on the previous/same UTC day", () => {
    const r = expandSchedule([{ id: "m1", times: ["00:15", "23:45"], active: true }], "2026-11-15", "2026-11-15");
    expect(r).toEqual([
      { medicineId: "m1", scheduledAt: at("2026-11-14T18:45:00Z"), localDate: "2026-11-15", localTime: "00:15" },
      { medicineId: "m1", scheduledAt: at("2026-11-15T18:15:00Z"), localDate: "2026-11-15", localTime: "23:45" },
    ]);
    expect(istDate(r[0].scheduledAt)).toBe("2026-11-15");
    expect(istDate(r[1].scheduledAt)).toBe("2026-11-15");
  });

  it.each([
    ["inactive medicine skipped", [{ id: "m1", times: ["08:00"], active: false }], 0],
    ["invalid time skipped", [{ id: "m1", times: ["8am", "25:00", "08:00"], active: true }], 1],
    ["duplicate times collapse", [{ id: "m1", times: ["08:00", "08:00"], active: true }], 1],
    ["two meds same time", [{ id: "a", times: ["08:00"], active: true }, { id: "b", times: ["08:00"], active: true }], 2],
  ] as [string, { id: string; times: string[]; active: boolean }[], number][])("%s", (_n, meds, n) => {
    expect(expandSchedule(meds, "2026-11-15", "2026-11-15")).toHaveLength(n);
  });

  it("empty when range is reversed", () => {
    expect(expandSchedule([{ id: "m1", times: ["08:00"], active: true }], "2026-11-16", "2026-11-15")).toEqual([]);
  });
});

describe("slotOf", () => {
  it.each([
    ["00:00", "morning"],
    ["08:00", "morning"],
    ["11:59", "morning"],
    ["12:00", "noon"],
    ["16:59", "noon"],
    ["17:00", "night"],
    ["21:30", "night"],
  ])("%s → %s", (t, slot) => {
    expect(slotOf(t)).toBe(slot);
  });
});
