# Security policy

Saathi handles health-adjacent data (medicines, adherence, emergency info). This is a hackathon prototype; the controls below are what it actually implements. File paths are in the [README security table](README.md#security).

## Reporting a vulnerability

Please open a private security advisory on the GitHub repository (Security → Report a vulnerability) rather than a public issue. Do not include real personal data in reports.

## Threat model and controls

| Threat | Control |
|---|---|
| Stolen or guessed passcode | bcrypt (cost 10), per-member passcodes, 5 failures → 15-minute lockout, identical error for wrong id / wrong passcode, constant-ish timing for unknown members |
| Session theft / forgery | HS256 JWT, httpOnly + Secure + SameSite=Lax cookie, 12 h expiry, audience-scoped; member and circle re-read from the DB on every request |
| IDOR / cross-circle access | Every route loads the target, checks circle membership (other circles get 404) and elder scoping, then the engine's `canPerform(role, mode, action)` |
| Privilege misuse | Server-side permission checks on every mutation; hidden buttons are only cosmetic |
| Malicious input | Zod schemas on all inputs (lengths, formats, ranges), request body size caps, uuid ids |
| Prompt injection / unsafe AI output | Only aggregate facts are sent to Gemini, as JSON data with an explicit "data, not instructions" rule; output is Zod-validated, length-capped, rendered as text (no `dangerouslySetInnerHTML`), with a deterministic fallback |
| Email link abuse | Signed JWT, ≤ 12 h, single-use (atomic `UPDATE … WHERE used_at IS NULL`), purpose- and member-scoped, no PII in the URL; GET only shows a confirm button (link scanners can't consume it); permissions re-checked on use |
| Cron abuse | `x-cron-secret` with SHA-256 + `timingSafeEqual`; scheduler is idempotent (optimistic lock on `escalation_level`, conditional reminder flags) |
| Tampering with history | Append-only audit log: app code only inserts; a DB trigger rejects UPDATE |
| Direct database access with the public key | RLS enabled on every table with **no policies**; privileges granted only to `service_role` and revoked from `anon` / `authenticated` (`002_grants.sql`); the service-role key is server-only |
| Clickjacking, sniffing, referrer leaks | CSP (`frame-ancestors 'none'`), `X-Frame-Options: DENY`, `nosniff`, `Referrer-Policy: no-referrer`, Permissions-Policy, HSTS |
| Abuse of sign-up | Circle creation rate limit: 5/hour per IP (per instance) + 60/hour global (DB count) |
| Emailing real people from the demo | Demo circle mail always goes to `DEMO_EMAIL_SINK`; demo personas use `@example.invalid` |

## Known limitations

- The per-IP limiter is in memory per server instance; the global cap is the cross-instance backstop.
- No passcode reset flow; a family member can add a new member instead.
- `npm audit`: 0 vulnerabilities in production dependencies; 7 moderate in dev-only ESLint tooling (`minimatch`).
- The CSP allows `'unsafe-inline'` scripts/styles (Next.js inline runtime + Framer Motion styles); no nonce-based CSP yet.
- `/api/health` is public and returns only the deployed commit and the email-link host.
