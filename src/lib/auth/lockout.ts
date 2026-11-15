export const MAX_FAILED_ATTEMPTS = 5;
export const LOCKOUT_MINUTES = 15;
export const GENERIC_LOGIN_ERROR = "That passcode didn't work. Please try again.";
export const LOCKED_ERROR = "Too many tries. Please wait 15 minutes and try again.";

export interface LockState {
  failedAttempts: number;
  lockedUntil: Date | null;
}

export interface LoginDecision {
  ok: boolean;
  next: LockState;
  error: string | null;
}

/** True while a member is inside a lockout window. */
export function isLocked(state: LockState, now: Date): boolean {
  return state.lockedUntil !== null && state.lockedUntil > now;
}

/**
 * Pure lockout logic. `passcodeOk` must only be computed when not locked
 * (callers should skip bcrypt while locked).
 */
export function evaluateLogin(state: LockState, passcodeOk: boolean, now: Date): LoginDecision {
  if (isLocked(state, now)) return { ok: false, next: state, error: LOCKED_ERROR };

  // Lock expired → start fresh.
  const failed = state.lockedUntil && state.lockedUntil <= now ? 0 : state.failedAttempts;

  if (passcodeOk) return { ok: true, next: { failedAttempts: 0, lockedUntil: null }, error: null };

  const attempts = failed + 1;
  if (attempts >= MAX_FAILED_ATTEMPTS) {
    return {
      ok: false,
      next: { failedAttempts: attempts, lockedUntil: new Date(now.getTime() + LOCKOUT_MINUTES * 60000) },
      error: LOCKED_ERROR,
    };
  }
  return { ok: false, next: { failedAttempts: attempts, lockedUntil: null }, error: GENERIC_LOGIN_ERROR };
}
