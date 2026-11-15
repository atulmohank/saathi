# Design critique log

Screens compared side by side with `docs/refs/*` (E-Joy, Petsyboo, Home Instead, Honor). Brutal on purpose.

## Round 1 — landing (1440)

What works: the hero finally has one big idea (green wordmark + phone overlapping it + grandmother in an arch + saffron sun), and it reads like the Petsyboo composition rather than a SaaS hero. Real faces change everything. The green Modes block with outlined "Modes" holds up next to E-Joy's outlined section titles. Bento mini-UIs look like product, not decoration.

Still amateur / template-like:
1. **Bug: reduced motion hides the hero art.** The entrance starts at opacity 0; when the reduced-motion flag flips after hydration the animation props are dropped and the arch + phone stay invisible. Unacceptable.
2. **Peach blob is cut into a hard rectangle** at the header line — looks like a rendering error.
3. **"साथी means companion" caption collides with the wordmark's "i".** Caption must sit clear of the type.
4. **The story thread runs straight through the heading** ("One missed dose" is crossed by the loop). The thread rule is: never on text.
5. **Trust cards are generic** — four identical white cards; next to E-Joy's raised colourful cards they feel like a SaaS feature row. Give each card its icon's tint and a bit more height/air; make the icons bigger.
6. **Story section feels flat in reduced motion** — fine as a list, but the heading is small (≈ H3 size) next to other H2s. Match the H2 scale.
7. **Footer is plain** next to Petsyboo's dark rounded blocks — add the thread and give the CTA more presence.
8. **Hero text column vs. visual**: the H1 sits ~120px lower than the arch's top; acceptable, but tighten the top padding so the first screen shows the wordmark's top.

Not a defect: blank persona/mode photos in the full-page capture are `loading="lazy"` images the capture never scrolled to.

## Round 2 — elder view + family dashboard (1440 and 375)

Fixed from round 1: reduced-motion hero bug, blob edge, caption collision, thread through text, tinted trust cards, mobile hero (phone now a fixed-size device scaled down, wordmark visible), Modes outline clear of the heading, shorter persona photos on phones.

Elder view now: a real time-of-day sky (peach sunrise, warm afternoon light, green→indigo night with moon and stars), her photo, the date in her language, "2 of 4 medicines taken today" dots, a translucent card with a 3D pill in its real colour. Next to E-Joy it finally feels like a product for her, not a form.

Still amateur:
1. **Heading font bug**: a global `h2 { font-family }` was unlayered and beat Tailwind utilities, so "Your next medicine" rendered in serif. Moved into `@layer base`. *(fixed)*
2. **White pills were outlines** on cream — read as empty. Pills now have a shaded rim, highlight and contact shadow. *(fixed)*
3. **Tamil "I took it" overflowed** the 375px viewport (one long word in a no-wrap flex button). Buttons now wrap and break long words. *(fixed)*
4. **Night card looked grey** (90% white over a dark sky) → 96% paper. *(fixed)*
5. **Moon collided with the language chips** on phones → moon only from `sm` up. *(fixed)*
6. **Time-machine buttons were pills with two-line text** — ovals look accidental. Rounded rectangles now. *(fixed)*
7. **Lower dashboard is still a stack of white cards** (Today, Appointments, Medicines, Care circle) — consistent but flat compared with the green band and tinted tiles above. Next round: two-column bento below the pillbox, member cards with faces, tinted section grounds.
8. **Secondary pages** (sign-in, create, emergency card, audit, Doctor Brief, email-link pages) still use the old layout with the new tokens — need the same header treatment and a warm ground.

## Round 3 — secondary pages + dashboard body (1440 and 375)

Fixed from round 2: lower dashboard is now a two-column bento (Today + Medicines | tinted Change requests, Tasks, Appointments panels), care-circle members have faces, every secondary page (sign-in, create, emergency card, audit, Doctor Brief, email-link pages) shares one warm shell (peach/sage ground, blob, thread, lockup).

Still weak, fixed this round:
1. **Sign-in was a lonely card in an empty page.** Now a split: form left, a family-at-home photo right in a 40px frame with a saffron sun and a glass caption — the Honor pattern. *(fixed)*
2. **Audit trail leaked raw ISO timestamps** ("at: 2026-11-15T08:00:00.000Z"). Dates now read in IST; noise keys hidden. *(fixed)*

Honest remaining gaps (not fixed, by choice or time):
- On phones the dashboard's Change requests / Tasks come after the medicine list (right column stacks below the left). Acceptable — Today stays first — but a caregiver might want requests higher.
- The create-circle form is long and plain compared with the rest; it works, but it's a form, not a moment.
- The time-machine panel is busy at 375 (timeline + email list stack long). It's a demo tool, so I left it.

Verdict: landing, elder view and dashboard now hold up next to the references — warm, photographic, one strong type gesture per screen, real product UI instead of decoration.
