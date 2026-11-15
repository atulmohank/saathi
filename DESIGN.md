# Saathi design system

Source of truth for colour, type, spacing and components. Built from the reference study in [docs/refs/NOTES.md](docs/refs/NOTES.md).

## Idea: the thread

*Saathi* means companion. The signature is a **saffron thread** — like the kalava/mauli thread tied on the wrist at home — drawn by hand, looping between sections and through the care circle. It is the one memorable gesture; everything around it is quiet: cream paper, deep green, real photographs of Indian families, big soft serif type.

What we deliberately avoid: identical card grids with one radius and a grey shadow; ALL-CAPS eyebrows above every heading; `→` on every link; numbered 01/02/03 markers on non-sequences; fade-up on every section.

## Colour

| Token | Hex | Use |
|---|---|---|
| `cream` | `#FBF7F0` | page ground |
| `paper` | `#FFFDF9` | raised cards |
| `ink` | `#1F2A24` | text (15.6:1 on cream) |
| `ink-soft` | `#3D4A43` | secondary text (9.4:1) |
| `muted` | `#5E675F` | captions, meta (5.9:1, AA) |
| `green` | `#1F5C4A` | brand, dark blocks, primary links (7.6:1) |
| `green-deep` | `#163F33` | footer, night sky base |
| `saffron` | `#E8A33D` | thread, CTA pill fill (ink text on it 8.2:1), sun |
| `saffron-ink` | `#8A5A12` | saffron-coloured text on cream (5.4:1) |
| `sage` | `#E7EFE9` | gradient, soft panels |
| `peach` | `#F6E3D3` | gradient, warm panels |
| `danger` | `#B3261E` · `success` `#2E7D4F` | status only, always with a glyph |

Gradients: `peach → cream` (story), `sage → cream` (trust, dashboard ground), a saffron radial "sun" (hero), one green block. No violet, no neon, no blue except the night sky's indigo `#2B3A67`.

## Type

| Role | Face | Size (desktop / phone) | Notes |
|---|---|---|---|
| Wordmark | Fraunces 600, opsz 144, SOFT 100 | `clamp(6rem, 22vw, 22rem)` | hero only, tracking −0.04em |
| Display | Fraunces 500, opsz 144 | 72 / 44 | line-height 1.02, `text-wrap: balance` |
| H2 | Fraunces 500 | 52 / 34 | |
| H3 | Fraunces 600 | 26 / 22 | |
| Outline title | Fraunces 700, `-webkit-text-stroke` 1.5px | `clamp(7rem, 18vw, 16rem)` | behind content, `aria-hidden`, 20% opacity |
| Body | Inter 400 | 18 / 17 | line-height 1.6, max 64ch |
| UI | Inter 500–600 | 15–16 | |
| Script | Caveat 600, saffron-ink | 32–44 | **max 3 uses on the landing page**, rotated −3° to −5°; never body text |
| Elder view | Inter / Noto per script | ≥ 22 | AAA contrast |

## Space, shape, depth

- Spacing scale (px): 4 · 8 · 12 · 16 · 24 · 32 · 48 · 64 · 96 · 128 · 160. Section padding 128–160 desktop, 72–96 phone.
- Radius by hierarchy, not one radius everywhere: chips 999 · inputs/buttons 999 (pills) · small cards 20 · cards 28 · photo frames 40 / arch (999 999 40 40) · section blocks 48.
- Shadow (tinted green, two layers):
  - `--lift-1: 0 1px 2px rgb(22 63 51 / .06), 0 8px 24px -12px rgb(22 63 51 / .18)`
  - `--lift-2: 0 2px 4px rgb(22 63 51 / .06), 0 32px 64px -28px rgb(22 63 51 / .35)`
- Texture: `PaperGrain` once in the layout, behind content.
- Blobs: 2 per screen at most, blurred 60–80px, sage / peach / saffron at 35–60% opacity.

## Layout

```
LANDING (1440)
┌ nav: lockup ·········· How it works · Modes · Sign in ── (Try the demo) ┐
│ Care for elders, shared by family — care, gently ✍                       │
│ S A A T H I  (22vw wordmark, green)       ┌phone┐   (arch photo + sun)   │
│ साथी ✍                                     │card │  chips ✓ ✉ 95%         │
│ plain PS line · (Try the demo) (Create a circle)                         │
├ trust: 4 raised cards with duotone icons (sage→cream ground) ────────────┤
├ full-bleed hands photo, green scrim, one sentence ───────────────────────┤
├ [ green block r48 · outlined "Modes" behind · 3 photo cards + ladders ] ─┤
├ story: peach→cream, ScrollStory, thread doodle ──────────────────────────┤
├ bento: 6 features (2 wide, 4 square) each with a live mini UI ───────────┤
├ try it: 5 photo persona cards with coloured role band · passcodes ───────┤
└ footer: green-deep, lockup-light, disclaimer, photo credits ─────────────┘
```

Alignment: left-aligned text everywhere except the wordmark and the photo band sentence; equal left/right content edges (`.wrap` = max 1240px, 24px gutters, 16px on phones).

## Components

- **Pill button** — primary: saffron fill, ink text, 56px tall, `--lift-1`, lifts 2px on hover, presses on click. Secondary: 1.5px green outline. On dark: cream fill, green text.
- **Raised card** — paper fill, 1px `rgb(31 42 36 / .06)` border, radius 28, `--lift-1`.
- **Glass chip** (hero) — `rgb(255 253 249 / .78)` + `backdrop-filter: blur(14px)`, radius 20, `--lift-2`, 1 icon + one line.
- **Photo frame** — arch or 40-radius, `object-fit: cover`, real alt text unless decorative.
- **Role band** — 6px coloured top band on persona cards: elder saffron, family peach-deep `#D9875A`, caretaker green, decision partner indigo `#2B3A67`.
- **Thread** — SVG path, saffron, 2.5px, round caps, `aria-hidden`, absolutely positioned under content.

## Elder view

Sky by IST hour: morning (5–11) peach sunrise; afternoon (11–17) warm saffron light; evening/night (17–5) deep green → indigo with moon and stars and light text. Translucent main card (radius 28, `--lift-2`), giant medicine name, pill drawn in its real colour, 64–80px buttons, small language chips. Text ≥ 22px, AAA contrast on every sky.

## Motion

One hero entrance (wordmark rises, phone floats in, chips settle), the ScrollStory, hover lifts on links/cards/buttons, pillbox fill and the escalation timeline. Everything respects `prefers-reduced-motion` (hydration-safe `useStill`, `MotionConfig reducedMotion="user"`).

## Review against the brief (what I changed from my first pass)

- First pass used one radius (28) on everything and a grey shadow — the SaaS card kit. Changed to a hierarchy of radii and green-tinted two-layer shadows.
- First pass put an eyebrow label above every section heading. Removed: headings carry the meaning; the script accent appears only three times.
- First pass made the trust strip numbered 01–04. These aren't a sequence, so no numbers.
