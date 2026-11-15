/**
 * Minimal in-memory stand-in for the Supabase query builder used by route integration tests.
 * Every filter/modifier is chainable; the chain resolves (await / .single() / .maybeSingle())
 * through a handler that decides the response from the table, the operation and the payload.
 */
export type Op = "select" | "insert" | "update" | "upsert" | "delete";
export interface Call {
  table: string;
  op: Op;
  payload?: unknown;
  filters: [string, string, unknown][];
}
export type Handler = (call: Call) => { data: unknown; error?: { message: string } | null; count?: number };

const CHAIN = ["select", "eq", "neq", "is", "gt", "gte", "lt", "lte", "in", "or", "order", "limit", "match"] as const;

export function createFakeDb(handler: Handler) {
  const calls: Call[] = [];
  const from = (table: string) => {
    const call: Call = { table, op: "select", filters: [] };
    const resolve = (single: boolean) => {
      calls.push(call);
      const r = handler(call);
      const data = single && Array.isArray(r.data) ? (r.data[0] ?? null) : r.data;
      return Promise.resolve({ data, error: r.error ?? null, count: r.count ?? null });
    };
    const b: Record<string, unknown> = {};
    for (const m of CHAIN) b[m] = (...args: unknown[]) => (m !== "select" && call.filters.push([m, String(args[0]), args[1]]), b);
    for (const op of ["insert", "update", "upsert"] as const) b[op] = (payload: unknown) => ((call.op = op), (call.payload = payload), b);
    b.delete = () => ((call.op = "delete"), b);
    b.single = () => resolve(true);
    b.maybeSingle = () => resolve(true);
    b.then = (ok: (v: unknown) => unknown, bad?: (e: unknown) => unknown) => resolve(false).then(ok, bad);
    return b;
  };
  return { db: { from }, calls };
}

/** Value of an `.eq(column, value)` filter on a call, if any. */
export const eqOf = (c: Call, col: string) => c.filters.find(([m, k]) => m === "eq" && k === col)?.[2];
