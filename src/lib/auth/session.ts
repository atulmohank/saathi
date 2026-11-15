import "server-only";
import { cookies } from "next/headers";
import { env } from "../env";
import { SESSION_TTL_SECONDS, signSession, verifySession, type SessionClaims } from "./jwt";

export const SESSION_COOKIE = "saathi_session";

/** Sets the signed session cookie (httpOnly, Secure in production, SameSite=Lax, 12 h). */
export async function createSession(claims: SessionClaims): Promise<void> {
  const token = await signSession(claims, env().SESSION_SECRET);
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

/** Reads and verifies the session cookie; null when absent or invalid. */
export async function getSession(): Promise<SessionClaims | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySession(token, env().SESSION_SECRET);
}

/** Deletes the session cookie (sign out). */
export async function destroySession(): Promise<void> {
  (await cookies()).delete(SESSION_COOKIE);
}
