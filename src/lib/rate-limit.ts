/**
 * Small sliding-window rate limiter. Pure (store and clock injected) so it is unit-tested.
 * In-memory per server instance; the circles route adds a global DB-backed cap on top.
 */
export type HitStore = Map<string, number[]>;

export function hit(store: HitStore, key: string, limit: number, windowMs: number, now: number): { allowed: boolean; retryAfterSec: number } {
  const recent = (store.get(key) ?? []).filter((t) => now - t < windowMs);
  if (recent.length >= limit) {
    store.set(key, recent);
    return { allowed: false, retryAfterSec: Math.ceil((recent[0] + windowMs - now) / 1000) };
  }
  recent.push(now);
  store.set(key, recent);
  if (store.size > 5000) for (const [k, v] of store) if (!v.some((t) => now - t < windowMs)) store.delete(k);
  return { allowed: true, retryAfterSec: 0 };
}

/** First hop of x-forwarded-for (set by Vercel), else a fixed key. */
export function clientKey(req: Request): string {
  return (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim().slice(0, 64) || "unknown";
}
