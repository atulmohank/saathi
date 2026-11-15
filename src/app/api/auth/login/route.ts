import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { audit } from "@/lib/audit";
import { evaluateLogin, GENERIC_LOGIN_ERROR, isLocked, LOCKED_ERROR } from "@/lib/auth/lockout";
import { createSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import type { Role } from "@/lib/engine/types";
import { handleError, readJson } from "@/lib/http";
import { loginSchema } from "@/lib/validation";

// Constant-ish work for unknown members so timing doesn't reveal which ids exist.
const DUMMY_HASH = bcrypt.hashSync("not-a-real-passcode", 10);

export async function POST(req: Request) {
  try {
    const { memberId, passcode } = loginSchema.parse(await readJson(req));
    const { data: m } = await db()
      .from("members")
      .select("id, circle_id, role, display_name, passcode_hash, failed_attempts, locked_until")
      .eq("id", memberId)
      .maybeSingle();

    if (!m) {
      await bcrypt.compare(passcode, DUMMY_HASH);
      return NextResponse.json({ error: GENERIC_LOGIN_ERROR }, { status: 401 });
    }

    const now = new Date();
    const state = { failedAttempts: m.failed_attempts, lockedUntil: m.locked_until ? new Date(m.locked_until) : null };
    if (isLocked(state, now)) return NextResponse.json({ error: LOCKED_ERROR }, { status: 429 });

    const ok = await bcrypt.compare(passcode, m.passcode_hash);
    const decision = evaluateLogin(state, ok, now);
    await db()
      .from("members")
      .update({ failed_attempts: decision.next.failedAttempts, locked_until: decision.next.lockedUntil?.toISOString() ?? null })
      .eq("id", m.id);

    if (!decision.ok) {
      if (decision.next.lockedUntil) {
        await audit({ circleId: m.circle_id, actor: null, action: "login_locked", entity: "member", entityId: m.id });
      }
      return NextResponse.json({ error: decision.error }, { status: decision.next.lockedUntil ? 429 : 401 });
    }

    await createSession({ sub: m.id, cid: m.circle_id, role: m.role as Role, name: m.display_name, demo: false });
    await audit({ circleId: m.circle_id, actor: m.id, action: "login", entity: "member", entityId: m.id });
    return NextResponse.json({ ok: true, circleId: m.circle_id, role: m.role });
  } catch (e) {
    return handleError(e);
  }
}
