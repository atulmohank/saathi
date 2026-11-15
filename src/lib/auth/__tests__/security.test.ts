import { describe, expect, it } from "vitest";
import { authorize, type Actor, type TargetElder } from "../access";
import { redeemActionToken, signActionToken, signSession, verifyActionToken, verifySession, type TokenStore } from "../jwt";
import { evaluateLogin, GENERIC_LOGIN_ERROR, LOCKED_ERROR, MAX_FAILED_ATTEMPTS } from "../lockout";

const SECRET = "a".repeat(40);
const OTHER = "b".repeat(40);
const U = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const t0 = new Date("2026-11-15T03:00:00Z");
const plus = (min: number) => new Date(t0.getTime() + min * 60000);

const memStore = (): TokenStore => {
  const used = new Set<string>();
  return {
    async consume(jti) {
      if (used.has(jti)) return false;
      used.add(jti);
      return true;
    },
  };
};
const claims = { jti: "jti-0123456789abcdef", purpose: "dose_taken" as const, ref_id: U(1), member_id: U(2) };

describe("email action tokens", () => {
  it("valid token redeems once", async () => {
    const tok = await signActionToken(claims, SECRET, t0);
    const store = memStore();
    expect(await redeemActionToken(tok, SECRET, store, plus(5))).toMatchObject(claims);
    expect(await redeemActionToken(tok, SECRET, store, plus(6))).toBeNull(); // reused
  });

  it("expired token rejected (12h max)", async () => {
    const tok = await signActionToken(claims, SECRET, t0);
    expect(await verifyActionToken(tok, SECRET, plus(12 * 60 + 1))).toBeNull();
  });

  it("ttl cannot exceed 12h even if asked", async () => {
    const tok = await signActionToken(claims, SECRET, t0, 48 * 3600);
    expect(await verifyActionToken(tok, SECRET, plus(13 * 60))).toBeNull();
  });

  it.each([
    ["wrong secret", async (t: string) => verifyActionToken(t, OTHER, plus(1))],
    [
      "tampered payload",
      async (t: string) => {
        const [h, p, s] = t.split(".");
        const body = JSON.parse(Buffer.from(p, "base64url").toString());
        body.member_id = U(9);
        return verifyActionToken(`${h}.${Buffer.from(JSON.stringify(body)).toString("base64url")}.${s}`, SECRET, plus(1));
      },
    ],
    ["truncated signature", async (t: string) => verifyActionToken(t.slice(0, -4), SECRET, plus(1))],
    ["garbage", async () => verifyActionToken("not.a.jwt", SECRET, plus(1))],
    ["oversized", async () => verifyActionToken("x".repeat(5000), SECRET, plus(1))],
  ])("rejects %s", async (_n, fn) => {
    const tok = await signActionToken(claims, SECRET, t0);
    expect(await fn(tok)).toBeNull();
  });

  it("a session token cannot be used as an action token (audience scoped)", async () => {
    const s = await signSession({ sub: U(2), cid: U(3), role: "family", name: "Priya", demo: false }, SECRET, t0);
    expect(await verifyActionToken(s, SECRET, plus(1))).toBeNull();
  });

  it("rejects a too-short secret", async () => {
    await expect(signActionToken(claims, "short", t0)).rejects.toThrow();
  });
});

describe("session JWT", () => {
  const c = { sub: U(2), cid: U(3), role: "caretaker" as const, name: "Lakshmi", demo: true };
  it("round-trips", async () => {
    expect(await verifySession(await signSession(c, SECRET, t0), SECRET, plus(60))).toEqual(c);
  });
  it("expires after 12h", async () => {
    expect(await verifySession(await signSession(c, SECRET, t0), SECRET, plus(12 * 60 + 1))).toBeNull();
  });
  it("rejects other secret", async () => {
    expect(await verifySession(await signSession(c, SECRET, t0), OTHER, plus(1))).toBeNull();
  });
  it("action token is not a session", async () => {
    expect(await verifySession(await signActionToken(claims, SECRET, t0), SECRET, plus(1))).toBeNull();
  });
});

describe("passcode lockout", () => {
  it(`locks after ${MAX_FAILED_ATTEMPTS} failures for 15 minutes`, () => {
    let state = { failedAttempts: 0, lockedUntil: null as Date | null };
    for (let i = 1; i < MAX_FAILED_ATTEMPTS; i++) {
      const d = evaluateLogin(state, false, t0);
      expect(d).toMatchObject({ ok: false, error: GENERIC_LOGIN_ERROR });
      state = d.next;
    }
    const fifth = evaluateLogin(state, false, t0);
    expect(fifth.error).toBe(LOCKED_ERROR);
    expect(fifth.next.lockedUntil).toEqual(plus(15));

    // Even the right passcode is refused while locked
    expect(evaluateLogin(fifth.next, true, plus(14))).toMatchObject({ ok: false, error: LOCKED_ERROR });
    // After the lock expires the right passcode works and the counter resets
    expect(evaluateLogin(fifth.next, true, plus(16))).toEqual({ ok: true, next: { failedAttempts: 0, lockedUntil: null }, error: null });
    // A wrong one after expiry starts a fresh count
    expect(evaluateLogin(fifth.next, false, plus(16)).next.failedAttempts).toBe(1);
  });

  it("success resets the counter", () => {
    expect(evaluateLogin({ failedAttempts: 3, lockedUntil: null }, true, t0).next.failedAttempts).toBe(0);
  });
});

describe("server-side authorization (authorize)", () => {
  const circleA = U(10);
  const circleB = U(20);
  const kamala: TargetElder = { id: U(11), circleId: circleA, mode: "independent" };
  const joseph: TargetElder = { id: U(12), circleId: circleA, mode: "supported" };
  const otherElder: TargetElder = { id: U(21), circleId: circleB, mode: "assisted" };
  const actor = (role: Actor["role"], circleId = circleA, elderId: string | null = null): Actor => ({ memberId: U(99), circleId, role, elderId });

  it.each([
    ["member of circle A cannot read circle B", actor("family"), otherElder, "view", false],
    ["member of circle A cannot edit circle B medicine", actor("caretaker"), otherElder, "edit_medicine", false],
    ["family can view own circle", actor("family"), kamala, "view", true],
    ["elder cannot see another elder in same circle", actor("elder", circleA, kamala.id), joseph, "view", false],
    ["elder sees her own care", actor("elder", circleA, kamala.id), kamala, "view", true],
    ["supported-mode elder (read-only display) cannot edit medicine", actor("elder", circleA, joseph.id), joseph, "edit_medicine", false],
    ["supported-mode elder cannot mark dose", actor("elder", circleA, joseph.id), joseph, "mark_dose", false],
    ["family cannot approve in independent mode", actor("family"), kamala, "approve_change", false],
    ["caretaker cannot manage members", actor("caretaker"), kamala, "manage_members", false],
  ] as [string, Actor, TargetElder, Parameters<typeof authorize>[2], boolean][])("%s", (_n, a, t, action, allowed) => {
    expect(authorize(a, t, action).allowed).toBe(allowed);
  });
});
