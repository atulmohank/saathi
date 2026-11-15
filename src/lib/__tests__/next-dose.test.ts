import { describe, expect, it } from "vitest";
import { isOpen, pickNextDose, type OpenDose } from "../next-dose";

const d = (id: string, hhmm: string, status: OpenDose["status"], display: string): OpenDose => ({
  id,
  scheduled_at: `2026-11-15T${hhmm}:00+05:30`,
  status,
  display,
});

describe("pickNextDose (elder's big card)", () => {
  it.each([
    ["nothing today", [], undefined],
    ["only taken/skipped", [d("a", "08:00", "taken", "taken"), d("b", "13:00", "skipped", "skipped")], undefined],
    ["upcoming only", [d("a", "08:00", "taken", "taken"), d("b", "20:00", "pending", "upcoming")], "b"],
    ["due beats upcoming", [d("b", "20:00", "pending", "upcoming"), d("a", "13:00", "pending", "due")], "a"],
    ["escalated (status missed) can still be taken late", [d("a", "08:00", "missed", "missed"), d("b", "20:00", "pending", "upcoming")], "a"],
    ["pending but shown missed (>60 min late)", [d("a", "08:00", "pending", "missed"), d("b", "20:00", "pending", "upcoming")], "a"],
    ["earliest open first", [d("c", "13:00", "pending", "due"), d("a", "08:00", "missed", "missed")], "a"],
  ] as [string, OpenDose[], string | undefined][])("%s", (_n, doses, id) => {
    expect(pickNextDose(doses)?.id).toBe(id);
  });
});

describe("isOpen", () => {
  it.each([
    ["pending", true],
    ["missed", true],
    ["taken", false],
    ["skipped", false],
  ] as [OpenDose["status"], boolean][])("%s → %s", (status, open) => {
    expect(isOpen({ status })).toBe(open);
  });
});
