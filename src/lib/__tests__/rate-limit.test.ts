import { describe, expect, it } from "vitest";
import { clientKey, hit, type HitStore } from "../rate-limit";

describe("rate limiter (sliding window)", () => {
  it("allows up to the limit, then blocks with retry-after", () => {
    const s: HitStore = new Map();
    for (let i = 0; i < 5; i++) expect(hit(s, "ip", 5, 60_000, 1000 + i).allowed).toBe(true);
    const blocked = hit(s, "ip", 5, 60_000, 2000);
    expect(blocked).toEqual({ allowed: false, retryAfterSec: 59 });
  });
  it("frees up as old hits leave the window", () => {
    const s: HitStore = new Map();
    for (let i = 0; i < 5; i++) hit(s, "ip", 5, 60_000, i * 1000);
    expect(hit(s, "ip", 5, 60_000, 59_000).allowed).toBe(false);
    expect(hit(s, "ip", 5, 60_000, 60_001).allowed).toBe(true);
  });
  it("keys are independent", () => {
    const s: HitStore = new Map();
    for (let i = 0; i < 5; i++) hit(s, "a", 5, 60_000, i);
    expect(hit(s, "a", 5, 60_000, 10).allowed).toBe(false);
    expect(hit(s, "b", 5, 60_000, 10).allowed).toBe(true);
  });
  it.each([
    ["first forwarded hop", { "x-forwarded-for": "203.0.113.7, 10.0.0.1" }, "203.0.113.7"],
    ["no header", {}, "unknown"],
  ])("clientKey: %s", (_n, headers, key) => {
    expect(clientKey(new Request("http://x/", { headers }))).toBe(key);
  });
});
