import { createHash, timingSafeEqual } from "node:crypto";

/** Constant-time secret check. Hashing first makes lengths equal so timing leaks nothing. */
export function secretMatches(provided: string | null | undefined, expected: string): boolean {
  if (!provided || !expected) return false;
  const a = createHash("sha256").update(provided).digest();
  const b = createHash("sha256").update(expected).digest();
  return timingSafeEqual(a, b);
}
