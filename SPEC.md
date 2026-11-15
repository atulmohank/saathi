# SPEC.md — Saathi: care that adapts to how much help she needs

> Single source of truth for the build. Claude Code: read this fully before writing code. Follow the phases in order. Do not add features not listed here without asking.

**Hackathon:** Catalyst x PromptWars (solo). Vertical: **Elderly Care & Medication Management Platform**.
**One-line pitch (show on homepage):** *Saathi is a shared medication & appointment platform for elders, caretakers and family — it adapts to how independent the elder is, and never stops treating her as the decision-maker.*

---

## 1. Problem statement → feature mapping (put this table in README too)

| PS requirement | Saathi feature |
|---|---|
| Shared ecosystem: elder, caretakers, family | Care Circle per elder with roles (Elder, Caretaker, Family, Decision Partner) |
| Secure, passcode-based access | Per-member passcode (bcrypt-hashed), lockout after 5 tries, signed httpOnly session |
| View/add/edit/manage medication schedules | Medicine CRUD with times, dose, pill look (colour/shape), stock count, critical flag |
| Track adherence | Dose log, adherence %, 7-day pillbox visual |
| Monitor upcoming doctor appointments | Appointments list + auto-generated Doctor Visit Brief |
| Proactive email reminders: missed meds, upcoming doses, appointments | Scheduler tick every 5 min → upcoming-dose, missed-dose escalation, appointment (24h & 2h) emails with one-click signed action links |
| Beyond a basic reminder app; smart, accessible, reliable, collaborative | Autonomy modes, reason-aware escalation, change proposals, double-dose guard, refill forecasting, multilingual read-aloud elder view |
| Elder remains at the centre of decisions | Elder approves changes (Independent mode), "I chose to skip" respected, every change visible to her + audit trail |

---

## 2. Stack

- **Next.js (App Router) + TypeScript (strict)**, Tailwind CSS
- **Supabase Postgres** used as a database only (NOT Supabase Auth). All DB access is server-side with the service-role key. RLS **enabled on every table with no policies** → anon/public access denied by default (defense in depth).
- **Zod** for every input (forms, API routes, Gemini output)
- **bcryptjs** for passcodes; **jose** for signed session JWT (httpOnly, Secure, SameSite=Lax, 12h expiry)
- **Nodemailer** + Gmail SMTP (app password)
- **@google/genai** (Gemini) — model name from env `GEMINI_MODEL`
- **Vitest** for unit tests, **Playwright** for 1–2 e2e smoke tests
- Deploy: **Vercel**. Scheduler: **external pinger (cron-job.org) every 5 min** → `POST /api/cron/tick` with header `x-cron-secret`. (Vercel Hobby cron is not frequent enough.) Also run the missed-dose check lazily when a care-circle page loads.

`.env.example` (commit this; never commit `.env.local`):
```
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
SESSION_SECRET=           # 32+ random chars
ACTION_LINK_SECRET=       # 32+ random chars, separate from session
CRON_SECRET=
GMAIL_USER=
GMAIL_APP_PASSWORD=
GEMINI_API_KEY=
GEMINI_MODEL=gemini-2.5-flash
APP_BASE_URL=http://localhost:3000
DEMO_EMAIL_SINK=          # all demo-circle emails go here, never to real people
```
No `NEXT_PUBLIC_` prefix on any secret.

---

## 3. Core concept: Autonomy modes (the heart of the "logical decision-making")

Each elder profile has `autonomy_mode`, chosen with the family:

| Mode | Who | Who can mark doses | Medicine changes | Missed-dose escalation |
|---|---|---|---|---|
| `independent` | Sharp, uses phone | Elder (others can too, logged) | **Proposal → elder approves/declines** | Elder at T+30m → caretaker on duty at T+60m → family at T+120m |
| `assisted` | Some forgetfulness | Elder or caretaker | Applied immediately; elder gets plain-language "What changed" card (read-aloud) | Elder + caretaker at T+20m → family at T+60m |
| `supported` | Dementia / frail | Caretaker only (elder view is a read-only display) | **Decision Partner** approves | Caretaker at T+10m → decision partner + family at T+30m |

Global rules (all modes):
- Change tagged `source = doctor_instruction` is **applied immediately** (never blocked), elder notified, logged.
- Elder's "I chose to skip" is respected: logged, **no escalation**, unless medicine `is_critical` → notify caretaker gently (not an alarm).
- Any escalation stops for everyone once someone resolves it (dose marked, or "I've handled it" clicked). No duplicate panic.

### Missed-dose reasons (one-tap, big buttons)
| Reason | Action |
|---|---|
| `ran_out` | Create refill task assigned to on-duty member; no alarm |
| `side_effect` | Flag on next appointment's Doctor Brief; gentle note to caretaker |
| `forgot` | Continue normal escalation ladder |
| `chose_to_skip` | Respect (see global rule) |
| `not_feeling_well` | Notify caretaker; flag for doctor brief |
| no reason / no response | Escalation ladder per mode |

---

## 4. Rules engine — `src/lib/engine/` (PURE functions, no I/O, 100% unit tested)

This module is what makes the logic visible to evaluators. Keep it framework-free.

- `permissions.ts` — `canPerform(role, mode, action): {allowed, reason}`; actions: `view`, `mark_dose`, `edit_medicine`, `approve_change`, `manage_members`, `edit_profile`.
  - Family role = view + mark dose (logged) + propose changes. Caretaker = mark dose, propose/apply per mode. Decision Partner = approve in supported mode. Elder = approve in independent mode; view everything about herself always.
- `escalation.ts` — `nextEscalationStep({mode, minutesLate, reason, isCritical, alreadyNotified, resolved}) → {notify: Role[], severity: 'info'|'gentle'|'urgent', stop: boolean}`
- `changes.ts` — `resolveChangeFlow({mode, source, actorRole}) → 'apply_now' | 'needs_elder_approval' | 'needs_decision_partner'`
- `doseGuard.ts` — `checkDoubleDose(doseLogs, scheduledDoseId, now) → {blocked, message: "Already taken at 8:02, marked by Ravi"}`
- `stock.ts` — `forecastRefill(stockCount, dosesPerDay) → {daysLeft, needsRefill (≤3 days)}`
- `adherence.ts` — `adherenceRate(logs, window)`; treats `chose_to_skip` separately (reported, not counted as failure in a punitive way — show both numbers).
- `schedule.ts` — expand medicine times into scheduled dose instances for a date range (IST, use date-fns-tz).

---

## 5. Data model (Supabase SQL migration in `supabase/migrations/001_init.sql`)

```
care_circles(id uuid pk, name text, created_at)
elders(id, circle_id fk, display_name, age int, autonomy_mode text check in (...), preferred_language text default 'en', emergency_info jsonb {blood_group, allergies[], conditions[], doctor_name, doctor_phone}, created_at)
members(id, circle_id fk, display_name, email, role text check in ('elder','caretaker','family','decision_partner'), passcode_hash text, is_on_duty bool, failed_attempts int default 0, locked_until timestamptz, created_at)
medicines(id, elder_id fk, name, dose_text, times text[] /* 'HH:mm' */, pill_look text, instructions text, stock_count int, is_critical bool, active bool, created_at, updated_at)
dose_events(id, medicine_id fk, scheduled_at timestamptz, status text check in ('pending','taken','missed','skipped'), reason text null, marked_by member_id null, marked_at, escalation_level int default 0, resolved_by member_id null, unique(medicine_id, scheduled_at))
appointments(id, elder_id fk, doctor_name, specialty, location, starts_at, notes, reminded_24h bool, reminded_2h bool)
change_proposals(id, elder_id, medicine_id null, proposed_by member_id, source text ('family'|'caretaker'|'doctor_instruction'), diff jsonb, status ('pending','approved','declined','applied'), decided_by, decided_at, created_at)
tasks(id, circle_id, kind ('refill'|'followup'), title, assigned_to member_id, done bool, created_at)
audit_log(id, circle_id, actor member_id, action text, entity text, entity_id uuid, before jsonb, after jsonb, created_at)  -- append-only: no update/delete in app code
action_tokens(jti text pk, purpose text, dose_event_id, member_id, expires_at, used_at null)  -- single-use email links
```
RLS enabled on all tables, no policies. Index `dose_events(scheduled_at, status)`.

---

## 6. Pages / UX

### Landing `/`
- Pitch line, 3-line "how it works", then **"Try the demo as…"** cards: **Kamala (Grandma, 68, Independent)**, **Priya (Daughter)**, **Nurse Lakshmi (Caretaker)**, plus a second elder **Joseph (84, Supported)** with son **Ravi (Decision Partner)**. One click → demo session (no passcode typing). Also "Create your own care circle" (real flow with passcodes).

### Elder view `/circle/[id]/today` (role = elder)
- **No nav, no sidebar.** One huge card for the next dose: time, medicine, dose, pill look (coloured pill icon), instructions. Big **"I took it"** button + **"Not now"** → reason buttons.
- 🔊 Read-aloud button (Web Speech API, language = elder's preferred_language; graceful fallback text if no voice installed).
- Pending change proposals shown as "Priya wants to change X → Y. [Approve] [Ask my doctor]" (independent mode). In assisted mode: "What changed today" card.
- Supported mode: read-only display ("Lakshmi will help you with your 1 PM tablets").
- Text ≥ 22px, AAA contrast, language switcher (top right, big).

### Family / caretaker view `/circle/[id]`
- Elder switcher (Kamala / Joseph), mode badge with one-line explanation.
- **Signature visual: 7-day pillbox** (Mon–Sun × Morning/Noon/Night compartments; filled = taken, empty-outlined = upcoming, amber = skipped w/ reason, red = missed). Each cell keyboard-focusable with aria-label.
- Today timeline, alerts feed (escalation history: "8:30 email to Kamala → 9:00 email to Lakshmi → resolved by Lakshmi 9:07"), tasks (refills), appointments, adherence %.
- Medicines CRUD (respects permissions; family edits become proposals).
- Members & roles, on-duty toggle.
- Audit trail page.
- Emergency card (printable, `@media print`).
- **Doctor Visit Brief** per appointment: Gemini summary of adherence, reported side effects, skip reasons, suggested questions — in English + elder's language. Zod-validate Gemini JSON; fallback to deterministic template if Gemini fails.

### Demo controls (jury can't wait an hour) — visible only in demo circle
- **"⏩ Time machine" panel:** "Simulate: Kamala missed 8 AM dose" / "Joseph missed 1 PM dose" / "Run scheduler now". Shows the escalation playing out differently per mode, plus **email previews** rendered in-app (actual emails go only to DEMO_EMAIL_SINK).
- "Reset demo" button.

---

## 7. Email

- Templates (accessible HTML + plain text): upcoming dose (T-10m), missed-dose escalation (per ladder), appointment 24h & 2h, change-proposal request, daily digest (optional).
- One-click links: `/a/[token]` — token = JWT signed with ACTION_LINK_SECRET, `{jti, purpose: 'dose_taken'|'handled'|'approve_change', ref_id, member_id}`, **expires ≤ 12h, single-use** (check/insert `action_tokens`), no PII in URL. Landing page confirms with a big friendly message.
- `POST /api/cron/tick`: verify `x-cron-secret` (constant-time compare), idempotent (unique constraints + escalation_level), processes due reminders/escalations. Return counts.

---

## 8. Languages

- Elder view + Doctor Brief: **English, हिन्दी, தமிழ், తెలుగు, ಕನ್ನಡ, മലയാളം** via JSON dictionaries in `src/i18n/` (elder view only has ~40 strings). Family/caretaker dashboards: English (state as an assumption in README).
- Read-aloud uses browser voices (`hi-IN`, `ta-IN`, `te-IN`, `kn-IN`, `ml-IN`); if a voice is unavailable, show "Voice not available on this device" — never crash.
- Mark translations as AI-assisted in README; Hindi & Malayalam human-checked.

---

## 9. Security (checklist — every item must exist; list them with file paths in README "Security" section)

1. No secrets in code; `.env.example` committed; secrets server-only.
2. Passcodes bcrypt-hashed (cost 10+); per-member; **5 failed tries → 15-min lockout**; generic error messages.
3. Session: signed JWT in httpOnly/Secure/SameSite cookie, 12h expiry.
4. **Authorization enforced server-side** via `engine/permissions.ts` on every mutation (not just hidden buttons) + member must belong to that circle (no IDOR).
5. Zod validation on all inputs; length limits; time format checks; dose/stock ranges.
6. Gemini output treated as untrusted: Zod-validated, rendered as text (never `dangerouslySetInnerHTML`), user data passed as data not instructions.
7. Email action tokens: signed, short-lived, single-use, scoped.
8. Cron endpoint secret-protected.
9. Append-only audit log.
10. Security headers in `next.config` (CSP, X-Frame-Options DENY, Referrer-Policy, X-Content-Type-Options, Permissions-Policy).
11. RLS deny-by-default on all tables.
12. `SECURITY.md`; `npm audit` clean of high/critical.
13. Demo data fictional; demo emails only to sink.

---

## 10. Testing

- **Vitest unit tests for every engine function** (table-driven): permissions matrix, escalation per mode × reason × critical, change flow incl. doctor_instruction bypass, double-dose guard, refill forecast, adherence incl. chose_to_skip, schedule expansion across IST midnight.
- Security tests: token expired / reused / tampered rejected; lockout after 5 attempts; viewer cannot edit medicine; member of circle A cannot read circle B.
- Zod schema tests (bad times, negative stock, oversized strings).
- Playwright smoke: landing → "Try as Kamala" → mark dose → appears in Priya's pillbox; keyboard-only navigation of elder view.
- `npm test` must pass; add test count + coverage line to README.

---

## 11. Accessibility

Semantic HTML, labels on all inputs, visible focus rings, skip link, full keyboard support, `aria-live` for toasts/escalations, alt text, `prefers-reduced-motion`, AA contrast everywhere and AAA in elder view, touch targets ≥ 48px, `lang` attribute switched with language. Run Lighthouse; target Accessibility 100; screenshot into `docs/`.

---

## 12. Design direction

Warm, calm, humane — **not** hospital blue, not neon, not a generic purple-gradient dashboard.
- Palette tokens: background cream `#FBF7F0`, surface `#FFFFFF`, ink `#1F2A24`, primary deep green `#1F5C4A`, accent saffron `#E8A33D` (sparingly), danger `#B3261E`, success `#2E7D4F`, muted `#6B7468`. Verify contrast.
- Type: a humanist serif for headings (e.g. Fraunces) + clean sans for UI (e.g. Inter / Noto Sans for Indic scripts — ensure Noto Sans Devanagari/Tamil/Telugu/Kannada/Malayalam load via next/font).
- Signature elements: the 7-day pillbox, the giant elder "Today" card, the escalation timeline.
- Mobile-first; check at 375px and 1440px.

---

## 13. Repo rules (hard)

Public repo, **only `main` branch**, < 10 MB, no `node_modules`/`.next`/`.env*` (except `.env.example`) committed. Commit + push after every phase with meaningful messages.

## 14. README must contain

Chosen vertical · one-line pitch · live link · demo instructions ("Try as…" + time machine) · PS→feature table · approach & logic (autonomy modes table, escalation ladder, reasons table) · architecture diagram (Mermaid) · how it works · security section with file paths · testing section · accessibility section · Google services used (Gemini for Doctor Brief) · assumptions (prototype not a certified medical device; family dashboard English-only; email via Gmail SMTP; IST timezone; translations AI-assisted) · local setup.

---

## 15. Phases & timeboxes (IST)

1. **10:45–12:00** Scaffold, env, Supabase migration + seed (demo circle), engine + its unit tests, passcode auth + sessions + permissions.
2. **12:00–13:30** UI: landing w/ "Try as…", elder Today view, family dashboard w/ pillbox, medicines CRUD, proposals, appointments.
3. **13:30–14:15** Email + action links + cron tick + time machine. **Deploy to Vercel by 14:15.** Set up cron-job.org.
4. **14:15–15:15** Doctor Brief (Gemini), languages + read-aloud, emergency card, audit page, refill tasks.
5. **15:15–16:00** Security headers, remaining tests, Playwright, accessibility pass, Lighthouse, README, SECURITY.md.
6. **16:00** Freeze. Final deploy check. 16:30 submit.

If behind schedule, cut in this order: Playwright → audit page UI (keep the log) → 6 languages (keep EN + HI) → Doctor Brief Gemini (keep template version). **Never cut:** engine + tests, modes, reasons, email escalation, pillbox, elder view, "Try as…" + time machine.
