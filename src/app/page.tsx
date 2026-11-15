/* eslint-disable @next/next/no-img-element -- art-directed, fixed-crop photographs */
import Link from "next/link";
import { TryAs, type PersonaCard } from "@/components/TryAs";
import Image from "next/image";
import dynamic from "next/dynamic";
import type { StoryStep } from "@/components/motion";
import { Bento } from "@/components/landing/Bento";
import { HeroStage } from "@/components/landing/HeroStage";
import { IconBell, IconHandHeart, IconLanguages, IconLock } from "@/components/landing/Icons";
import { Thread } from "@/components/landing/Thread";

/** Below the fold: split into its own chunk (still server-rendered). */
const ScrollStory = dynamic(() => import("@/components/motion/ScrollStory").then((mod) => mod.ScrollStory));

const personas: PersonaCard[] = [
  { id: "kamala", name: "Kamala", role: "Elder", band: "bg-accent", blurb: "68 · Independent", detail: "Sees one big card for her next medicine and approves every change herself.", photo: "/images/kamala-arch.webp", alt: "Kamala, a smiling grandmother in a pink sari" },
  { id: "priya", name: "Priya", role: "Family", band: "bg-[#D9875A]", blurb: "Kamala’s daughter", detail: "Watches the week’s pillbox from Pune. Her edits go to Kamala as requests.", photo: "/images/priya-card.webp", alt: "Priya, laughing, in a green sari and glasses" },
  { id: "lakshmi", name: "Nurse Lakshmi", role: "Caretaker", band: "bg-primary", blurb: "On duty", detail: "Marks doses for Joseph and picks up refill tasks.", photo: "/images/lakshmi-card.webp", alt: "Lakshmi in a white coat with a stethoscope" },
  { id: "joseph", name: "Joseph", role: "Elder", band: "bg-accent", blurb: "84 · Supported", detail: "A calm, read-only screen that says who will help with which medicines.", photo: "/images/joseph-card.webp", alt: "Joseph, an older man with an orange scarf, sitting with his grandson" },
  { id: "ravi", name: "Ravi", role: "Decision partner", band: "bg-indigo", blurb: "Joseph’s son", detail: "Approves medicine changes for his father.", photo: "/images/ravi-card.webp", alt: "Ravi, smiling, with a grey beard and a checked scarf" },
];

const trust = [
  { tone: "bg-[linear-gradient(165deg,#FFF6E6_0%,#FFFDF9_60%)]", Icon: IconLock, title: "A passcode for each person", body: "Everyone signs in with their own passcode. Five wrong tries pause sign-in for 15 minutes." },
  { tone: "bg-[linear-gradient(165deg,#EAF3EE_0%,#FFFDF9_60%)]", Icon: IconBell, title: "An email when a dose is missed", body: "The right person hears at 10, 30, 60 or 120 minutes, depending on the care mode." },
  { tone: "bg-[linear-gradient(165deg,#FBEAE1_0%,#FFFDF9_60%)]", Icon: IconHandHeart, title: "The elder decides", body: "Family changes arrive as requests. A doctor’s instruction applies straight away." },
  { tone: "bg-[linear-gradient(165deg,#ECEFF8_0%,#FFFDF9_60%)]", Icon: IconLanguages, indic: true, title: "Six Indian languages", body: "English, हिन्दी, தமிழ், తెలుగు, ಕನ್ನಡ and മലയാളം, with read-aloud." },
];

const modes = [
  {
    name: "Independent",
    who: "The elder uses a phone and makes the decisions.",
    how: "Family edits arrive as requests that the elder approves.",
    photo: "/images/kamala-avatar.webp",
    alt: "Kamala smiling",
    ladder: [
      ["+30 min", "The elder"],
      ["+60 min", "Caretaker on duty"],
      ["+2 hours", "Family"],
    ],
  },
  {
    name: "Assisted",
    who: "The elder is a little forgetful.",
    how: "Changes apply straight away, and the elder gets a plain-language note.",
    photo: "/images/elders-laughing.webp",
    alt: "Two older women in red saris laughing together",
    ladder: [
      ["+20 min", "Elder and caretaker"],
      ["+60 min", "Family"],
    ],
  },
  {
    name: "Supported",
    who: "The elder lives with dementia or frailty.",
    how: "The caretaker marks doses; a decision partner approves changes.",
    photo: "/images/joseph-avatar.webp",
    alt: "Joseph, an older man in an orange scarf",
    ladder: [
      ["+10 min", "Caretaker on duty"],
      ["+30 min", "Decision partner and family"],
    ],
  },
];

/** Matches the rules engine: "ran out" creates a refill task for whoever is on duty, never an alarm. */
const story: StoryStep[] = [
  { time: "8:00", title: "Reminder sent", body: "Kamala gets one calm nudge for her morning medicine. Nobody else is disturbed." },
  { time: "8:30", title: "Not taken — Kamala taps “I ran out”", body: "One big button. She says why in a single tap, and Saathi acts on the reason." },
  { time: "8:31", title: "A refill task for Lakshmi. No panic.", body: "Running out is not an emergency, so there is no alarm ladder — just a refill task for the caretaker on duty." },
  { time: "Thursday", title: "Doctor brief ready", body: "The skipped dose and its reason are already in the brief for Thursday’s visit." },
];

const credits = [
  ["Richard Saunders", "rdsaunders"],
  ["Pranav Rasal", "mrpranav87"],
  ["Ashwini Chaudhary (Monty)", "suicide_chewbacca"],
  ["Fotos", "fotospk"],
  ["Wilfred Sequeira", "wilfredsequeira"],
  ["Trương Tuyết Ly", "liliantruong2603"],
  ["Frederick Shaw", "dropfastcollective"],
  ["Miles Burke", "milesb"],
  ["National Cancer Institute", "nci"],
  ["WorldSikhOrg", "worldsikhorg"],
];

export default function Home() {
  return (
    <>
      {/* page-top glow, clipped on its own layer so it never shows a hard edge */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 -z-[1] h-[64rem] overflow-hidden">
        <div className="blob -right-48 -top-48 size-[40rem] bg-peach opacity-70" />
      </div>
      <header className="relative z-30">
        <nav aria-label="Main" className="wrap flex items-center justify-between gap-4 py-5">
          <Link href="/" className="inline-flex min-h-11 items-center" aria-label="Saathi home">
            <img src="/brand/saathi-logo-animated.svg" alt="" width={168} height={48} className="h-11 w-auto" />
          </Link>
          <div className="flex items-center gap-1 sm:gap-3">
            <a href="#story" className="btn-ghost hidden text-ink-soft md:inline-flex">
              How it works
            </a>
            <a href="#modes" className="btn-ghost hidden text-ink-soft md:inline-flex">
              Care modes
            </a>
            <Link href="/signin" className="btn-ghost hidden sm:inline-flex">
              Sign in with passcode
            </Link>
            <a href="#try" className="btn-saffron min-h-11 px-5">
              Try the demo
            </a>
          </div>
        </nav>
      </header>

      <main id="main" className="flex-1">
        {/* HERO */}
        <section aria-labelledby="hero-h" className="relative">
          <div className="wrap relative grid items-center gap-10 pb-0 pt-4 lg:grid-cols-[1.05fr_1fr] lg:gap-6 lg:pt-2">
            <div className="relative z-10">
              <h1 id="hero-h" className="text-[2.75rem] font-medium leading-[1.02] text-ink sm:text-[4.25rem]" style={{ fontVariationSettings: '"opsz" 144, "SOFT" 100' }}>
                Medicines and doctor visits, shared by the whole family
              </h1>
              <p className="script mt-3 -rotate-3 text-[2.6rem] sm:text-[3.25rem]">care, gently</p>
              <p className="mt-6 max-w-[34rem] text-lg text-ink-soft">
                Medication reminders, adherence tracking and doctor appointments — shared securely between elders, caretakers and family, with email
                alerts when a dose is missed.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <a href="#try" className="btn-saffron min-h-14 px-8 text-lg">
                  Try the demo
                </a>
                <Link href="/create" className="btn-secondary min-h-14 px-8 text-lg">
                  Create a care circle
                </Link>
              </div>
            </div>
            <HeroStage />
          </div>

          {/* the wordmark: one huge type gesture, the phone overlaps it */}
          <div className="relative mt-10 select-none sm:-mt-16" aria-hidden="true">
            <p
              className="whitespace-nowrap text-center font-serif font-semibold leading-[0.78] tracking-[-0.045em] text-primary"
              style={{ fontSize: "clamp(6rem, 25vw, 23rem)", fontVariationSettings: '"opsz" 144, "SOFT" 100' }}
            >
              Saathi
            </p>
            <p className="absolute left-[6%] top-[-6%] -rotate-6 font-[family-name:var(--font-hand-deva)] text-[clamp(2.25rem,6vw,4.5rem)] font-bold text-saffron-ink">साथी</p>
          </div>
          <p className="wrap pb-16 pt-6 text-center text-sm text-muted">
            <span lang="hi" className="system-indic">साथी</span> (Saathi) means “companion” in Hindi.
          </p>
        </section>

        {/* TRUST */}
        <section aria-labelledby="trust-h" className="relative bg-[linear-gradient(180deg,var(--cream)_0%,var(--sage)_100%)] py-24 sm:py-32">
          <Thread variant="wave" className="absolute inset-x-0 top-0 h-28 w-full opacity-70" />
          <div className="wrap relative">
            <h2 id="trust-h" className="max-w-2xl text-[2.25rem] font-medium leading-tight sm:text-[3.25rem]">
              Built for the people who look after each other
            </h2>
            <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4" role="list">
              {trust.map(({ Icon, title, body, tone, indic }) => (
                <li key={title} className={`card flex flex-col p-7 pt-8 ${tone}`}>
                  <Icon className="size-20 -ml-1" />
                  <h3 className="mt-6 text-[1.4rem] font-semibold leading-snug">{title}</h3>
                  <p className={`mt-2 text-ink-soft ${indic ? "system-indic" : ""}`}>{body}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* PHOTO BAND */}
        <section aria-labelledby="band-h" className="relative isolate overflow-hidden">
          <Image src="/images/care-hands-band.webp" alt="An older person’s hands resting together on a blue sari" fill sizes="100vw" className="-z-10 object-cover" />
          <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgb(22_63_51/.92)_0%,rgb(22_63_51/.72)_45%,rgb(22_63_51/.15)_100%)]" />
          <div className="wrap on-dark flex min-h-[30rem] items-center py-24 sm:min-h-[36rem]">
            <h2 id="band-h" className="max-w-[16ch] text-[2.5rem] font-medium leading-[1.08] text-white sm:text-[4rem]">
              Missed a dose? The right person knows — and she stays in charge.
            </h2>
          </div>
        </section>

        {/* MODES */}
        <section id="modes" aria-labelledby="modes-h" className="py-24 sm:py-32">
          <div className="wrap">
            <div className="on-dark relative overflow-hidden rounded-[48px] bg-primary px-6 py-16 text-white sm:px-14 sm:py-20">
              <span aria-hidden="true" data-text="Modes" className="outline-title absolute -bottom-6 -right-4 text-[clamp(6rem,18vw,16rem)] text-white/15 before:content-[attr(data-text)] md:bottom-auto md:-right-6 md:-top-8" />
              <div aria-hidden="true" className="blob -bottom-24 -left-24 size-80 bg-accent opacity-25" />
              <h2 id="modes-h" className="relative max-w-xl text-[2.25rem] font-medium leading-tight text-white sm:text-[3.25rem]">
                Three care modes, chosen with the elder
              </h2>
              <p className="relative mt-4 max-w-xl text-lg text-[#D7E4DC]">
                Each mode changes who marks doses, who approves changes and who hears about a missed dose — and when.
              </p>
              <ul className="relative mt-12 grid gap-5 md:grid-cols-3" role="list">
                {modes.map((m) => (
                  <li key={m.name} className="flex flex-col rounded-[32px] bg-paper p-6 text-ink shadow-[var(--lift-2)]">
                    <div className="flex items-center gap-4">
                      <Image src={m.photo} alt={m.alt} width={64} height={64} className="size-16 rounded-full object-cover ring-4 ring-sage" />
                      <h3 className="text-[1.75rem] font-semibold leading-none text-primary">{m.name}</h3>
                    </div>
                    <p className="mt-5 font-semibold text-ink">{m.who}</p>
                    <p className="mt-1 text-ink-soft">{m.how}</p>
                    <ol className="mt-6 space-y-0 border-t border-[var(--line)] pt-5" aria-label={`${m.name}: who is emailed about a missed dose`}>
                      {m.ladder.map(([t, who], i) => (
                        <li key={t} className="relative flex items-baseline gap-3 pb-3 pl-6 last:pb-0">
                          <span aria-hidden="true" className={`absolute left-0 top-1.5 size-3 rounded-full ${i === 0 ? "bg-accent" : "bg-danger"}`} />
                          {i < m.ladder.length - 1 && <span aria-hidden="true" className="absolute left-[5px] top-5 h-[calc(100%-0.75rem)] w-0.5 bg-[#E6DFD8]" />}
                          <span className="w-20 shrink-0 text-sm font-semibold text-muted">{t}</span>
                          <span className="text-sm font-medium text-ink">{who}</span>
                        </li>
                      ))}
                    </ol>
                  </li>
                ))}
              </ul>
              <p className="relative mt-10 max-w-3xl text-[#D7E4DC]">
                In every mode a doctor’s instruction applies at once, “I chose to skip” is respected without alarms, and escalation stops for
                everyone the moment someone marks the dose.
              </p>
            </div>
          </div>
        </section>

        {/* STORY */}
        <div id="story" className="relative bg-[linear-gradient(180deg,var(--cream)_0%,var(--peach)_18%,var(--peach)_70%,var(--cream)_100%)]">
          <Thread variant="wave" className="absolute inset-x-0 top-0 h-16 w-full opacity-80" />
          <ScrollStory steps={story} heading="One missed dose. No panic." />
        </div>

        {/* BENTO */}
        <section aria-labelledby="features-h" className="py-24 sm:py-32">
          <div className="wrap">
            <h2 id="features-h" className="max-w-2xl text-[2.25rem] font-medium leading-tight sm:text-[3.25rem]">
              Everything the circle needs, nothing it doesn’t
            </h2>
            <div className="mt-12">
              <Bento />
            </div>
          </div>
        </section>

        {/* TRY IT — the DEMO / 1234 credentials shown here are intentionally public, for the fictional demo circle only (bcrypt-hashed at seed time). */}
        <section id="try" aria-labelledby="try-h" className="relative overflow-hidden bg-[linear-gradient(180deg,var(--cream)_0%,var(--sage)_100%)] py-24 sm:py-32">
          <div aria-hidden="true" className="blob -right-32 top-20 size-96 bg-peach opacity-70" />
          <div className="wrap relative">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h2 id="try-h" className="text-[2.25rem] font-medium leading-tight sm:text-[3.25rem]">
                  Try it as someone in the family
                </h2>
                <p className="script mt-2 -rotate-2 text-[2.25rem]">no passcode needed</p>
                <p className="mt-4 max-w-xl text-lg text-ink-soft">One fictional family, two elders in different care modes. Demo emails go to a test inbox, never to real people.</p>
              </div>
              <div className="card max-w-sm p-6">
                <p className="font-semibold text-ink">Prefer the real passcode sign-in?</p>
                <p className="mt-1 text-ink-soft">
                  Circle code <strong className="font-mono text-ink">DEMO</strong>, passcode <strong className="font-mono text-ink">1234</strong> for every demo
                  person.
                </p>
                <Link href="/signin" className="btn-secondary mt-4 min-h-11">
                  Sign in with passcode
                </Link>
              </div>
            </div>
            <div className="mt-12">
              <TryAs personas={personas} />
            </div>
          </div>
        </section>
      </main>

      <footer className="on-dark relative overflow-hidden bg-green-deep text-[#D7E4DC]">
        <Thread variant="loop" className="absolute inset-x-0 top-6 h-40 w-full opacity-50" />
        <div className="wrap relative grid gap-10 pb-16 pt-28 md:grid-cols-[1fr_1.4fr]">
          <div>
            <img src="/brand/saathi-lockup-light.svg" alt="Saathi" width={168} height={51} className="h-12 w-auto" />
            <p className="mt-4 max-w-sm">A hackathon prototype for elders, caretakers and family. Not a certified medical device. All times in IST.</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/create" className="btn-light min-h-11">
                Create a care circle
              </Link>
              <Link href="/signin" className="btn-ghost text-white">
                Sign in with passcode
              </Link>
            </div>
          </div>
          <div className="text-sm">
            <p className="font-semibold text-white">Photographs</p>
            <p className="mt-2 leading-relaxed">
              From Unsplash (Unsplash Licence), shown as demo personas — not real users:{" "}
              {credits.map(([n, u], i) => (
                <span key={u}>
                  <a href={`https://unsplash.com/@${u}`} className="underline decoration-white/30 underline-offset-2 hover:decoration-white" rel="noopener noreferrer">
                    {n}
                  </a>
                  {i < credits.length - 1 ? ", " : "."}
                </span>
              ))}
            </p>
          </div>
        </div>
      </footer>
    </>
  );
}
