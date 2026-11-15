# Reference study — what makes these feel premium

Captured 15 Nov 2026 at 1440×900 in the in-app browser. Behance refuses headless Playwright with HTTP 400/403, so the screenshots came from the desktop browser pane. Images stay local (gitignored: third-party work); only these notes are committed.

| Ref                | Files               |
| ------------------ | ------------------- |
| E-Joy (Behance)    | `ejoy-0…4.jpg`      |
| Petsyboo (Behance) | `petsyboo-0…4.jpg`  |
| Home Instead       | `homeinstead-0.jpg` |
| Honor              | `honor-0…1.jpg`     |

## 10 things that make them premium (and how Saathi applies each)

1. **One huge type gesture per screen.** Petsyboo sets its wordmark at ~25vw, edge to edge, and lets a photo overlap it. E-Joy puts "Overview" / "Ideate" in giant outlined letters behind the section. → Saathi: a full-width "Saathi" wordmark in the hero with the phone mockup overlapping it; giant outlined "Modes" behind the green block. One per screen, never two.
2. **Real people, photographed warmly, filling the frame.** Home Instead's hero is a single full-bleed photo with a green scrim and text on top; Honor uses candid caregiver photos in rounded cards. Nothing is stock-posed against white. → Indian family photos, cropped tight on faces and hands, in arch and pill frames, plus one full-bleed band.
3. **A handwritten voice used sparingly.** Petsyboo's red/saffron script words ("Structure", "Happiness", "Trusted") sit beside a grotesque headline, 1–2 words each, rotated a few degrees. → Caveat in saffron, max 3 uses on the landing page ("साथी", "care, gently", one note in the story).
4. **Hand-drawn loopy lines** thread behind content (Petsyboo's white loops on blue, E-Joy's wavy line through the persona). They connect sections, never sit on text. → One SVG "thread" doodle per long section, `aria-hidden`, under content.
5. **Big radii and soft layered depth.** Cards and section blocks use 32–48px radii; shadows are two-layer (tight contact + wide 40–60px blur at very low opacity), never a single grey drop. E-Joy's phones float with a long soft shadow. → Radius scale 20 / 28 / 40 / 48, shadow `0 1px 2px` + `0 24px 60px -24px` tinted with ink green, not black.
6. **Colour blocks as rhythm.** Petsyboo alternates a cream page with full-width blue and near-black rounded blocks (inset from the edges, 40px radius). Home Instead uses one strong brand green. → Cream page, one deep-green inset block (Modes), one peach→cream gradient (Story), green footer. Max one dark block per screen.
7. **Soft gradient grounds and blobs, not flat white.** E-Joy's pale lilac/blue blobs drift behind phones; Honor uses a single bold organic shape. → Sage and peach blobs behind the hero and story; one saffron "sun" disc behind the grandmother.
8. **Product shown as a device mockup with real UI.** E-Joy and Petsyboo show the actual screens inside a phone at an angle, overlapping type or people. → CSS phone with the real elder Today card (same tokens as the app) overlapping the wordmark.
9. **Generous spacing and few words per screen.** Home Instead's hero has one headline, one sentence, one form. Honor's sections are 1 headline + 2 lines + image. Sections breathe 120–160px vertically. → 96–160px section padding at desktop, max ~60 words per section, line length < 70ch.
10. **Trust signals as objects, not lists.** Petsyboo's FAQ cards hold a photo each; Home Instead leads with "Who needs care?" choices; E-Joy uses colourful 3D-style icons in raised cards. → Trust strip of 4 raised cards with colourful duotone icons (passcodes, email alerts, elder decides, 6 languages); persona cards with real photos and coloured role bands.

## Also noted

- Pill-shaped CTAs (Petsyboo's coral pills, Home Instead's lime pill phone CTA). Primary = saffron pill on cream; secondary = outlined pill.
- Type pairing: a soft geometric/grotesque for UI + a characterful display. We keep Fraunces (display, optical size up to 144) + Inter (UI) + Caveat (script).
- Motion: almost none on the sites themselves; the premium feel comes from composition. Keep one hero entrance, the story scroll, and hover lifts.
