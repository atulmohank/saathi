import "server-only";
import { randomBytes } from "node:crypto";
import { ACTION_TTL_SECONDS, redeemActionToken, signActionToken, type ActionClaims, type TokenStore } from "./auth/jwt";
import { db } from "./db";
import { appBaseUrl, env } from "./env";

/** Creates a signed, single-use, ≤12h link. The URL carries only opaque ids — no names, emails or medicines. */
export async function createActionLink(purpose: ActionClaims["purpose"], refId: string, memberId: string, now = new Date()): Promise<string> {
  const jti = randomBytes(18).toString("base64url");
  await db()
    .from("action_tokens")
    .insert({
      jti,
      purpose,
      dose_event_id: purpose === "approve_change" ? null : refId,
      member_id: memberId,
      expires_at: new Date(now.getTime() + ACTION_TTL_SECONDS * 1000).toISOString(),
    });
  const token = await signActionToken({ jti, purpose, ref_id: refId, member_id: memberId }, env().ACTION_LINK_SECRET, now);
  return `${appBaseUrl()}/a/${token}`;
}

/** DB-backed single-use store: one atomic conditional UPDATE. */
export const dbTokenStore: TokenStore = {
  async consume(jti, now) {
    const { data } = await db()
      .from("action_tokens")
      .update({ used_at: now.toISOString() })
      .eq("jti", jti)
      .is("used_at", null)
      .gt("expires_at", now.toISOString())
      .select("jti");
    return !!data?.length;
  },
};

/** Verifies an emailed action token and consumes it once (DB-backed single use). Returns the claims or null. */
export async function redeem(token: string, now = new Date()) {
  return redeemActionToken(token, env().ACTION_LINK_SECRET, dbTokenStore, now);
}
