import { SignJWT, jwtVerify } from "jose";
import { z } from "zod";
import { ROLES } from "../engine/types";

/** Session + action-link JWT helpers. Pure (secret passed in) so they are unit-testable. */

export const SESSION_TTL_SECONDS = 12 * 60 * 60;
export const ACTION_TTL_SECONDS = 12 * 60 * 60;

const key = (secret: string) => {
  if (!secret || secret.length < 32) throw new Error("JWT secret missing or too short");
  return new TextEncoder().encode(secret);
};

export const sessionClaims = z.object({
  sub: z.uuid(), // member id
  cid: z.uuid(), // circle id
  role: z.enum(ROLES),
  name: z.string().max(60),
  demo: z.boolean(),
});
export type SessionClaims = z.infer<typeof sessionClaims>;

export async function signSession(claims: SessionClaims, secret: string, now = new Date()): Promise<string> {
  const iat = Math.floor(now.getTime() / 1000);
  return new SignJWT({ cid: claims.cid, role: claims.role, name: claims.name, demo: claims.demo })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(claims.sub)
    .setAudience("saathi:session")
    .setIssuedAt(iat)
    .setExpirationTime(iat + SESSION_TTL_SECONDS)
    .sign(key(secret));
}

export async function verifySession(token: string, secret: string, now = new Date()): Promise<SessionClaims | null> {
  try {
    const { payload } = await jwtVerify(token, key(secret), {
      audience: "saathi:session",
      algorithms: ["HS256"],
      currentDate: now,
    });
    const parsed = sessionClaims.safeParse(payload);
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

export const ACTION_PURPOSES = ["dose_taken", "handled", "approve_change"] as const;
export const actionClaims = z.object({
  jti: z.string().min(16).max(64),
  purpose: z.enum(ACTION_PURPOSES),
  ref_id: z.uuid(),
  member_id: z.uuid(),
});
export type ActionClaims = z.infer<typeof actionClaims>;

export async function signActionToken(
  c: ActionClaims,
  secret: string,
  now = new Date(),
  ttlSeconds = ACTION_TTL_SECONDS,
): Promise<string> {
  const iat = Math.floor(now.getTime() / 1000);
  return new SignJWT({ purpose: c.purpose, ref_id: c.ref_id, member_id: c.member_id })
    .setProtectedHeader({ alg: "HS256" })
    .setJti(c.jti)
    .setAudience("saathi:action")
    .setIssuedAt(iat)
    .setExpirationTime(iat + Math.min(ttlSeconds, ACTION_TTL_SECONDS))
    .sign(key(secret));
}

export async function verifyActionToken(token: string, secret: string, now = new Date()): Promise<ActionClaims | null> {
  if (token.length > 2048) return null;
  try {
    const { payload } = await jwtVerify(token, key(secret), {
      audience: "saathi:action",
      algorithms: ["HS256"],
      currentDate: now,
    });
    const parsed = actionClaims.safeParse(payload);
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

/** Single-use store abstraction (DB-backed in prod, in-memory in tests). */
export interface TokenStore {
  /** Atomically mark used; returns false if unknown or already used. */
  consume(jti: string, now: Date): Promise<boolean>;
}

export async function redeemActionToken(
  token: string,
  secret: string,
  store: TokenStore,
  now = new Date(),
): Promise<ActionClaims | null> {
  const claims = await verifyActionToken(token, secret, now);
  if (!claims) return null;
  return (await store.consume(claims.jti, now)) ? claims : null;
}
