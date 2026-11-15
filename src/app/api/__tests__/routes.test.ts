import bcrypt from "bcryptjs";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { createFakeDb, type Handler } from "@/test/fake-db";

/** Route integration tests: real route handlers + validation + engine, with the database, session cookie and email faked. */

const U = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
let handler: Handler = () => ({ data: null });
const fake = createFakeDb((c) => handler(c));

vi.mock("@/lib/db", () => ({ db: () => fake.db }));
vi.mock("@/lib/auth/session", () => ({ createSession: vi.fn(async () => undefined), getSession: vi.fn(), destroySession: vi.fn() }));
vi.mock("@/lib/auth/guard", async () => {
  const actual = await vi.importActual<typeof import("@/lib/auth/guard")>("@/lib/auth/guard");
  return { ...actual, requirePermission: vi.fn(), requireActor: vi.fn() };
});
vi.mock("@/lib/changes-apply", () => ({ applyMedicineChange: vi.fn(async () => U(50)) }));
vi.mock("@/lib/scheduler", () => ({ runScheduler: vi.fn(async () => ({ upcoming: 1, escalationEmails: 2, appointmentEmails: 0, dosesChecked: 3 })) }));

const { AuthError, requirePermission } = await import("@/lib/auth/guard");
const { createSession } = await import("@/lib/auth/session");
const { applyMedicineChange } = await import("@/lib/changes-apply");

beforeAll(() => {
  Object.assign(process.env, {
    SUPABASE_URL: "https://example.supabase.co",
    SUPABASE_SERVICE_ROLE_KEY: "test-service-role-key-0000",
    SESSION_SECRET: "a".repeat(40),
    ACTION_LINK_SECRET: "b".repeat(40),
    CRON_SECRET: "c".repeat(40),
  });
});
beforeEach(() => {
  vi.clearAllMocks();
  fake.calls.length = 0;
});

const post = (url: string, body: unknown, headers: Record<string, string> = {}) =>
  new Request(`http://localhost${url}`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": `10.0.0.${Math.floor(Math.random() * 250)}`, ...headers },
    body: JSON.stringify(body),
  });

describe("POST /api/auth/login", async () => {
  const { POST } = await import("../auth/login/route");
  const hash = bcrypt.hashSync("4821", 4);
  const member = { id: U(1), circle_id: U(2), role: "family", display_name: "Meena", passcode_hash: hash, failed_attempts: 0, locked_until: null };

  it("happy path: correct passcode → 200, session created, counter reset", async () => {
    handler = (c) => (c.table === "members" && c.op === "select" ? { data: member } : { data: null });
    const res = await POST(post("/api/auth/login", { memberId: U(1), passcode: "4821" }));
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ ok: true, circleId: U(2), role: "family" });
    expect(createSession).toHaveBeenCalledWith(expect.objectContaining({ sub: U(1), cid: U(2), demo: false }));
    expect(fake.calls.find((c) => c.table === "members" && c.op === "update")?.payload).toEqual({ failed_attempts: 0, locked_until: null });
  });

  it("auth failure: wrong passcode → 401 generic error, attempt counted, no session", async () => {
    handler = (c) => (c.table === "members" && c.op === "select" ? { data: member } : { data: null });
    const res = await POST(post("/api/auth/login", { memberId: U(1), passcode: "0000" }));
    expect(res.status).toBe(401);
    expect((await res.json()).error).toMatch(/didn't work/);
    expect(createSession).not.toHaveBeenCalled();
    expect(fake.calls.find((c) => c.op === "update")?.payload).toMatchObject({ failed_attempts: 1 });
  });

  it("auth failure: locked member → 429 without checking the passcode", async () => {
    handler = () => ({ data: { ...member, failed_attempts: 5, locked_until: new Date(Date.now() + 600_000).toISOString() } });
    const res = await POST(post("/api/auth/login", { memberId: U(1), passcode: "4821" }));
    expect(res.status).toBe(429);
    expect(createSession).not.toHaveBeenCalled();
  });

  it.each([
    ["letters in passcode", { memberId: U(1), passcode: "abcd" }],
    ["not a uuid", { memberId: "1 OR 1=1", passcode: "1234" }],
    ["missing body", null],
  ])("validation failure: %s → 400, database untouched", async (_n, body) => {
    const res = await POST(post("/api/auth/login", body));
    expect(res.status).toBe(400);
    expect(fake.calls).toHaveLength(0);
  });
});

describe("POST /api/doses/mark", async () => {
  const { POST } = await import("../doses/mark/route");
  const scheduled = new Date(Date.now() - 10 * 60_000).toISOString();
  const dose = {
    id: U(10),
    medicine_id: U(11),
    scheduled_at: scheduled,
    status: "pending",
    reason: null,
    marked_by: null,
    marked_at: null,
    medicines: { id: U(11), elder_id: U(12), name: "Metformin", is_critical: false, stock_count: 10 },
  };
  const actor = { memberId: U(13), circleId: U(14), role: "elder", elderId: U(12), name: "Kamala", demo: true };

  it("happy path: taken → 200, dose updated by the actor, stock decremented", async () => {
    vi.mocked(requirePermission).mockResolvedValue({ actor, elder: { id: U(12), circleId: U(14), mode: "independent" } } as never);
    handler = (c) => (c.table === "dose_events" && c.op === "select" ? { data: c.filters.some(([m]) => m === "gte") ? [dose] : dose } : { data: null });
    const res = await POST(post("/api/doses/mark", { doseEventId: U(10), status: "taken" }));
    expect(res.status).toBe(200);
    expect(requirePermission).toHaveBeenCalledWith(U(12), "mark_dose");
    expect(fake.calls.find((c) => c.table === "dose_events" && c.op === "update")?.payload).toMatchObject({ status: "taken", marked_by: U(13) });
    expect(fake.calls.find((c) => c.table === "medicines" && c.op === "update")?.payload).toEqual({ stock_count: 9 });
  });

  it("auth failure: not allowed in this mode → 403, nothing written", async () => {
    vi.mocked(requirePermission).mockRejectedValue(new AuthError(403, "In supported mode only the caretaker marks doses."));
    handler = (c) => (c.op === "select" ? { data: dose } : { data: null });
    const res = await POST(post("/api/doses/mark", { doseEventId: U(10), status: "taken" }));
    expect(res.status).toBe(403);
    expect(fake.calls.filter((c) => c.op !== "select")).toHaveLength(0);
  });

  it.each([
    ["bad uuid", { doseEventId: "abc", status: "taken" }],
    ["status missed is not allowed from the UI", { doseEventId: U(10), status: "missed" }],
    ["unknown skip reason", { doseEventId: U(10), status: "skipped", reason: "lazy" }],
  ])("validation failure: %s → 400", async (_n, body) => {
    const res = await POST(post("/api/doses/mark", body));
    expect(res.status).toBe(400);
    expect(fake.calls).toHaveLength(0);
  });
});

describe("POST /api/cron/tick", async () => {
  const { POST } = await import("../cron/tick/route");
  it("happy path: right secret → 200 with the scheduler's counts", async () => {
    const res = await POST(new Request("http://localhost/api/cron/tick", { method: "POST", headers: { "x-cron-secret": "c".repeat(40) } }));
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ ok: true, upcoming: 1, escalationEmails: 2, dosesChecked: 3 });
  });
  it("auth failure: wrong secret → 401, scheduler never runs", async () => {
    const { runScheduler } = await import("@/lib/scheduler");
    const res = await POST(new Request("http://localhost/api/cron/tick", { method: "POST", headers: { "x-cron-secret": "nope" } }));
    expect(res.status).toBe(401);
    expect(runScheduler).not.toHaveBeenCalled();
  });
});

describe("POST /api/proposals/[id]", async () => {
  const { POST } = await import("../proposals/[id]/route");
  const proposal = {
    id: U(20),
    elder_id: U(21),
    medicine_id: U(22),
    proposed_by: U(23),
    source: "family",
    diff: { times: ["09:00"] },
    status: "pending",
    decided_by: null,
    created_at: "2026-11-15T03:00:00Z",
  };
  const actor = { memberId: U(24), circleId: U(25), role: "elder", elderId: U(21), name: "Kamala", demo: true };
  const ctx = (id: string) => ({ params: Promise.resolve({ id }) });

  it("happy path: elder approves → 200, claimed atomically, change applied", async () => {
    vi.mocked(requirePermission).mockResolvedValue({ actor, elder: { id: U(21), circleId: U(25), mode: "independent" } } as never);
    handler = (c) =>
      c.table === "change_proposals" && c.op === "select" ? { data: proposal } : c.op === "update" ? { data: [{ id: U(20) }] } : { data: null };
    const res = await POST(post(`/api/proposals/${U(20)}`, { decision: "approve" }), ctx(U(20)));
    expect(res.status).toBe(200);
    expect(requirePermission).toHaveBeenCalledWith(U(21), "approve_change");
    expect(applyMedicineChange).toHaveBeenCalledWith(expect.objectContaining({ medicineId: U(22), diff: { times: ["09:00"] } }));
  });

  it("auth failure: family cannot approve in independent mode → 403, nothing applied", async () => {
    vi.mocked(requirePermission).mockRejectedValue(new AuthError(403, "In independent mode only she can approve changes."));
    handler = (c) => (c.op === "select" ? { data: proposal } : { data: null });
    const res = await POST(post(`/api/proposals/${U(20)}`, { decision: "approve" }), ctx(U(20)));
    expect(res.status).toBe(403);
    expect(applyMedicineChange).not.toHaveBeenCalled();
  });

  it("already decided by someone else → 409", async () => {
    vi.mocked(requirePermission).mockResolvedValue({ actor, elder: { id: U(21), circleId: U(25), mode: "independent" } } as never);
    handler = (c) => (c.op === "select" ? { data: proposal } : c.op === "update" ? { data: [] } : { data: null });
    const res = await POST(post(`/api/proposals/${U(20)}`, { decision: "approve" }), ctx(U(20)));
    expect(res.status).toBe(409);
    expect(applyMedicineChange).not.toHaveBeenCalled();
  });

  it.each([
    ["route param is not a uuid", "1;drop", { decision: "approve" }],
    ["unknown decision", U(20), { decision: "maybe" }],
  ])("validation failure: %s → 400", async (_n, id, body) => {
    const res = await POST(post(`/api/proposals/${id}`, body), ctx(id));
    expect(res.status).toBe(400);
    expect(fake.calls).toHaveLength(0);
  });
});
