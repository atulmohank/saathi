import { Pill } from "@/components/Pill";
import { TryAs, type PersonaCard } from "@/components/TryAs";

const personas: PersonaCard[] = [
  { id: "kamala", name: "Kamala", initial: "K", blurb: "Grandma, 68 · Independent", detail: "Sees one big card for her next medicine and approves every change herself." },
  { id: "priya", name: "Priya", initial: "P", blurb: "Kamala's daughter", detail: "Watches the week's pillbox from Pune. Her edits go to Kamala as requests." },
  { id: "lakshmi", name: "Nurse Lakshmi", initial: "L", blurb: "Caretaker on duty", detail: "Marks doses for Joseph and picks up refill tasks." },
  { id: "joseph", name: "Joseph", initial: "J", blurb: "84 · Supported", detail: "A calm, read-only display that says who will help with which medicines." },
  { id: "ravi", name: "Ravi", initial: "R", blurb: "Joseph's son · Decision partner", detail: "Approves medicine changes for his father." },
];

const modes = [
  { name: "Independent", who: "The elder uses a phone and makes the decisions.", how: "Family edits arrive as requests that the elder approves. Reminders go to the elder first." },
  { name: "Assisted", who: "The elder is a little forgetful.", how: "Changes apply straight away, and the elder gets a plain-language note. The elder and the caretaker are reminded together." },
  { name: "Supported", who: "The elder lives with dementia or frailty.", how: "The caretaker marks doses and a decision partner approves changes. The elder's screen simply says who will help." },
];

const week: ("t" | "s" | "m" | "u")[][] = [
  ["t", "t", "t", "s", "t", "t", "u"],
  ["t", "t", "m", "t", "t", "t", "u"],
  ["t", "t", "t", "t", "s", "t", "u"],
];
const CELL = { t: "bg-success", s: "bg-accent", m: "bg-danger", u: "border-2 border-primary bg-surface" } as const;

/** The product itself: Kamala's next-dose card and her week, drawn with the real components' look. */
function HeroPreview() {
  return (
    <div aria-hidden="true" className="relative mx-auto w-full max-w-md select-none">
      <div className="card border-2 border-primary p-6 shadow-[0_24px_60px_-30px_rgb(31_42_36/0.45)]">
        <p className="text-sm font-semibold text-muted">Kamala · next medicine</p>
        <div className="mt-3 flex items-center gap-4">
          <Pill look="pink round" size={56} />
          <div>
            <p className="font-serif text-3xl">Amlodipine</p>
            <p className="text-lg">5 mg · 8:00 AM</p>
          </div>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3">
          <span className="btn-primary min-h-14 text-lg">✓ I took it</span>
          <span className="btn-secondary min-h-14 text-lg">Not now</span>
        </div>
      </div>
      <div className="card mt-4 p-5">
        <p className="text-sm font-semibold text-muted">95% of this week&apos;s doses taken</p>
        <div className="mt-3 grid gap-1.5">
          {week.map((row, i) => (
            <div key={i} className="grid grid-cols-7 gap-1.5">
              {row.map((c, j) => (
                <span key={j} className={`h-7 rounded-md ${CELL[c]}`} />
              ))}
            </div>
          ))}
        </div>
      </div>
      <p className="mt-3 text-center text-sm text-muted">All times IST</p>
    </div>
  );
}

export default function Home() {
  return (
    <main id="main" className="flex-1">
      <section className="border-b border-[#E6DFD8]">
        <div className="wrap grid min-h-[calc(100svh-1px)] items-center gap-12 py-16 lg:grid-cols-[1.25fr_1fr]">
          <div>
          <p className="font-serif text-2xl text-primary">Saathi</p>
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
          </div>
          <HeroPreview />
        </div>
      </section>

      <section id="modes" aria-labelledby="modes-h" className="border-b border-[#E6DFD8] bg-surface">
        <div className="wrap py-16 sm:py-24">
          <h2 id="modes-h" className="font-serif text-3xl sm:text-4xl">
            Three care modes, chosen with the elder
          </h2>
          <ol className="mt-10 grid gap-6 md:grid-cols-3" role="list">
            {modes.map((m, i) => (
              <li key={m.name} className="card p-6">
                <p className="text-sm font-semibold text-muted">Mode {i + 1}</p>
                <h3 className="mt-1 font-serif text-2xl text-primary">{m.name}</h3>
                <p className="mt-3 font-medium">{m.who}</p>
                <p className="mt-2 text-[#3D4A43]">{m.how}</p>
              </li>
            ))}
          </ol>
          <p className="mt-8 max-w-3xl text-[#3D4A43]">
            In every mode, a doctor&apos;s instruction applies at once, &ldquo;I chose to skip&rdquo; is respected
            without alarms, and escalation stops for everyone the moment someone marks the dose.
          </p>
        </div>
      </section>

      <section id="try" aria-labelledby="try-h">
        <div className="wrap py-16 sm:py-24">
          <h2 id="try-h" className="font-serif text-3xl sm:text-4xl">
            Try the demo as…
          </h2>
          <p className="mt-3 max-w-2xl text-[#3D4A43]">
            One fictional family, two elders in different modes. No passcode needed; demo emails go to a test inbox,
            never to real people.
          </p>
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
