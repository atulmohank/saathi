# Saathi brand + motion kit

Unzip at the repo root — paths already match.

## Where everything goes

```
public/brand/
  saathi-mark.svg              64px mark (cupped hands = diya, flame holds a pill)
  saathi-mark-light.svg        for dark/green backgrounds
  saathi-lockup.svg            mark + "Saathi" (Fraunces 600, outlined — no font needed)
  saathi-lockup-light.svg
  saathi-lockup-bilingual.svg  Saathi + साथी
  saathi-logo-animated.svg     draws itself in ~1.2s (CSS keyframes inside the SVG)
  favicon.svg                  32px — also copy to src/app/icon.svg for Next App Router
  avatars/      kamala · priya · lakshmi · joseph · ravi · doctor   (96px)
  illustrations/
    hero.svg                   layers: #hero-background #hero-family-circle #hero-grandmother
                               #hero-pillbox (#pill-1…7) #hero-floating (#float-*)
    all-doses-taken.svg
    nothing-scheduled.svg
src/components/motion/
  HeroScene.tsx  ScrollStory.tsx  PillboxFill.tsx  TimelineReveal.tsx
  Reveal.tsx     PaperGrain.tsx   index.ts
```

`npm i framer-motion` is the only install.

## Use

```tsx
import { HeroScene, ScrollStory, PillboxFill, TimelineReveal, Reveal, RevealGroup, RevealItem, PaperGrain } from "@/components/motion";

<PaperGrain />                                   // once, in layout.tsx
<img src="/brand/saathi-logo-animated.svg" alt="Saathi" height={48} />
<HeroScene className="w-full max-w-2xl" />
<ScrollStory />                                  // needs /brand/avatars/*.svg
<Reveal><YourSection /></Reveal>
<RevealGroup>{cards.map(c => <RevealItem key={c.id}>{c.node}</RevealItem>)}</RevealGroup>

<PillboxFill status={dose.status} label="Monday morning, Metformin — taken 8:02" onPress={markTaken} />
//  status: "upcoming" | "taken" | "skipped" | "missed"  → maps 1:1 to dose_events.status ("pending" → "upcoming")

<TimelineReveal steps={[
  { time: "8:30", title: "Email to Kamala", tone: "gentle" },
  { time: "9:00", title: "Email to Lakshmi (on duty)", tone: "urgent" },
  { time: "9:07", title: "Resolved by Lakshmi", tone: "resolved" },
]} />
```

## Notes

- All components are client components (`"use client"`), TypeScript strict, and read `prefers-reduced-motion`:
  with it on you get the static final state (ScrollStory un-pins and lists all four steps).
- ScrollStory uses Tailwind utility classes for layout; the rest use inline styles only.
- Headings read `var(--font-fraunces)` if you expose Fraunces through next/font, else fall back to Fraunces/Georgia.
- CSP: PaperGrain is a `data:` SVG background → `img-src 'self' data:`. Framer Motion writes inline styles → `style-src 'self' 'unsafe-inline'`.
- Decorative SVGs carry `<title>`/`<desc>`; when an image sits next to text that says the same thing, use `alt=""`.
- Total SVG weight: ~41 KB.
