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
