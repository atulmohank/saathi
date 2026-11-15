import Link from "next/link";
import { TryAs, type PersonaCard } from "@/components/TryAs";
import { HeroScene, Reveal, RevealGroup, RevealItem, ScrollStory, type StoryStep } from "@/components/motion";

const personas: PersonaCard[] = [
  { id: "kamala", name: "Kamala", blurb: "Grandma, 68 · Independent", detail: "Sees one big card for her next medicine and approves every change herself." },
  { id: "priya", name: "Priya", blurb: "Kamala's daughter", detail: "Watches the week's pillbox from Pune. Her edits go to Kamala as requests." },
  { id: "lakshmi", name: "Nurse Lakshmi", blurb: "Caretaker on duty", detail: "Marks doses for Joseph and picks up refill tasks." },
  { id: "joseph", name: "Joseph", blurb: "84 · Supported", detail: "A calm, read-only display that says who will help with which medicines." },
  { id: "ravi", name: "Ravi", blurb: "Joseph's son · Decision partner", detail: "Approves medicine changes for his father." },
];

const modes = [
  { name: "Independent", who: "The elder uses a phone and makes the decisions.", how: "Family edits arrive as requests that the elder approves. Reminders go to the elder first." },
  { name: "Assisted", who: "The elder is a little forgetful.", how: "Changes apply straight away, and the elder gets a plain-language note. The elder and the caretaker are reminded together." },
  { name: "Supported", who: "The elder lives with dementia or frailty.", how: "The caretaker marks doses and a decision partner approves changes. The elder's screen simply says who will help." },
];

/** Matches the rules engine: "ran out" creates a refill task for whoever is on duty, never an alarm. */
const story: StoryStep[] = [
  { time: "8:00", title: "Reminder sent", body: "Kamala gets one calm nudge for her morning medicine. Nobody else is disturbed." },
  { time: "8:30", title: "Not taken — Kamala taps “I ran out”", body: "One big button. She says why in a single tap, and Saathi acts on the reason." },
  { time: "8:31", title: "A refill task for Lakshmi. No panic.", body: "Running out is not an emergency, so there is no alarm ladder — just a refill task for the caretaker on duty." },
  { time: "Thursday", title: "Doctor brief ready", body: "The skipped dose and its reason are already in the brief for Thursday’s visit." },
];

export default function Home() {
  return (
    <main id="main" className="flex-1">
      <section className="border-b border-[#E6DFD8]">
        <div className="wrap grid min-h-[calc(100svh-1px)] items-center gap-10 py-12 lg:grid-cols-[1.15fr_1fr] lg:py-16">
          <div>
            {/* eslint-disable-next-line @next/next/no-img-element -- animated SVG, CSS keyframes inside */}
            <img src="/brand/saathi-logo-animated.svg" alt="Saathi" height={48} width={168} className="h-12 w-auto" />
            <h1 className="mt-6 max-w-4xl font-serif text-4xl leading-[1.1] tracking-tight sm:text-6xl">
              Shared medicines and doctor visits for elders, caretakers and family.
            </h1>
            <p className="mt-6 max-w-2xl text-lg text-ink sm:text-xl">
              Medication reminders, adherence tracking and doctor appointments — shared securely between elders,
              caretakers and family, with email alerts when a dose is missed.
            </p>
            <p className="mt-4 max-w-2xl text-[#3D4A43]">
              Saathi adapts to how independent the elder is and keeps the elder as the decision-maker. A missed dose
              reaches the right person at 30, 60 or 120 minutes, depending on the care mode.
            </p>
            <p className="mt-3 text-sm text-muted">
              <span lang="hi">साथी</span> (Saathi) means &ldquo;companion&rdquo; in Hindi.
            </p>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <a href="#try" className="btn-primary">
                Try the demo
              </a>
              <a href="#modes" className="btn-secondary">
                See the three care modes
              </a>
            </div>
            <p className="mt-6 flex flex-wrap gap-x-6 gap-y-2">
              <Link href="/create" className="btn-ghost px-0 font-semibold">
                Create your own care circle →
              </Link>
              <Link href="/signin" className="btn-ghost px-0 font-semibold">
                Sign in with passcode →
              </Link>
            </p>
          </div>
          <HeroScene className="mx-auto w-full max-w-2xl" />
        </div>
      </section>

      <section id="modes" aria-labelledby="modes-h" className="border-b border-[#E6DFD8] bg-surface">
        <div className="wrap py-16 sm:py-24">
          <Reveal>
            <h2 id="modes-h" className="font-serif text-3xl sm:text-4xl">
              Three care modes, chosen with the elder
            </h2>
          </Reveal>
          <RevealGroup className="mt-10 grid gap-6 md:grid-cols-3">
            {modes.map((m, i) => (
              <RevealItem key={m.name} className="card p-6">
                <p className="text-sm font-semibold text-muted">Mode {i + 1}</p>
                <h3 className="mt-1 font-serif text-2xl text-primary">{m.name}</h3>
                <p className="mt-3 font-medium">{m.who}</p>
                <p className="mt-2 text-[#3D4A43]">{m.how}</p>
              </RevealItem>
            ))}
          </RevealGroup>
          <Reveal>
            <p className="mt-8 max-w-3xl text-[#3D4A43]">
              In every mode, a doctor&apos;s instruction applies at once, &ldquo;I chose to skip&rdquo; is respected
              without alarms, and escalation stops for everyone the moment someone marks the dose.
            </p>
          </Reveal>
        </div>
      </section>

      <ScrollStory steps={story} className="border-b border-[#E6DFD8]" />

      <section id="try" aria-labelledby="try-h">
        <div className="wrap py-16 sm:py-24">
          <Reveal>
            <h2 id="try-h" className="font-serif text-3xl sm:text-4xl">
              Try the demo as…
            </h2>
            <p className="mt-3 max-w-2xl text-[#3D4A43]">
              One fictional family, two elders in different modes. No passcode needed; demo emails go to a test inbox,
              never to real people.
            </p>
            <p className="mt-3 max-w-2xl rounded-xl bg-surface p-4 text-[#3D4A43]">
              Want to try the real passcode sign-in?{" "}
              <Link href="/signin" className="font-semibold text-primary underline underline-offset-4">
                Sign in with passcode
              </Link>{" "}
              using circle code <strong className="font-mono">DEMO</strong> and passcode <strong className="font-mono">1234</strong> (same for
              every demo person).
            </p>
          </Reveal>
          <div className="mt-10">
            <TryAs personas={personas} />
          </div>
        </div>
      </section>

      <footer className="border-t border-[#E6DFD8]">
        <div className="wrap flex flex-col gap-2 py-8 text-sm text-muted sm:flex-row sm:justify-between">
          <p>Saathi · a hackathon prototype, not a certified medical device.</p>
          <p>All times in IST.</p>
        </div>
      </footer>
    </main>
  );
}
