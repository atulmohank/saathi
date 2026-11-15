import { PillboxFill } from "../motion";

/** Six features, each with a small, real-looking slice of the product. Mini UIs are illustrations (aria-hidden); the text carries the meaning. */

const FIT = "block w-full [&_span]:!block [&_svg]:!h-auto [&_svg]:!w-full";
const week: ("taken" | "skipped" | "missed" | "upcoming")[][] = [
  ["taken", "taken", "taken", "skipped", "taken", "taken", "upcoming"],
  ["taken", "taken", "missed", "taken", "taken", "taken", "upcoming"],
  ["taken", "taken", "taken", "taken", "skipped", "taken", "upcoming"],
];

function Tile({ title, body, className = "", tone = "bg-paper", children }: { title: string; body: string; className?: string; tone?: string; children: React.ReactNode }) {
  return (
    <article className={`relative flex flex-col overflow-hidden rounded-[32px] border border-[var(--line)] p-6 shadow-[var(--lift-1)] sm:p-8 ${tone} ${className}`}>
      <h3 className="text-[1.5rem] font-semibold leading-tight text-ink">{title}</h3>
      <p className="mt-2 max-w-[44ch] text-ink-soft">{body}</p>
      <div aria-hidden="true" className="mt-6 flex flex-1 items-end">
        {children}
      </div>
    </article>
  );
}

export function Bento() {
  return (
    <div className="grid gap-5 md:grid-cols-6">
      <Tile title="A pillbox for the whole week" body="Every compartment fills as doses are taken. Skipped and missed doses show their own mark, never colour alone." className="md:col-span-4" tone="bg-[linear-gradient(160deg,#FFFDF9_0%,#E7EFE9_100%)]">
        <div className="w-full rounded-3xl bg-paper/80 p-4 shadow-[var(--lift-1)]">
          <div className="grid grid-cols-[3.5rem_repeat(7,1fr)] items-center gap-1.5 text-center text-[11px] font-semibold text-muted sm:gap-2">
            <span />
            {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
              <span key={i}>{d}</span>
            ))}
            {week.map((row, r) => (
              <div key={r} className="contents">
                <span className="text-left">{["Morning", "Noon", "Night"][r]}</span>
                {row.map((s, i) => (
                  <span key={i} className={`mx-auto w-full max-w-11 ${FIT}`}>
                    <PillboxFill status={s} label="" />
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      </Tile>

      <Tile title="“Not now” has reasons" body="One tap says why. Ran out makes a refill task; her own choice is respected without alarms." className="md:col-span-2" tone="bg-[linear-gradient(160deg,#FFFDF9_0%,#F6E3D3_100%)]">
        <div className="flex w-full flex-wrap gap-2">
          {["I ran out", "It makes me unwell", "I forgot", "I chose to skip", "Not feeling well"].map((r, i) => (
            <span key={r} className={`rounded-full px-3.5 py-2 text-sm font-semibold ${i === 3 ? "bg-primary text-white" : "bg-paper text-primary ring-1 ring-primary/30"}`}>
              {r}
            </span>
          ))}
        </div>
      </Tile>

      <Tile title="She approves the changes" body="In independent mode, family edits arrive as requests. Doctor’s instructions apply at once." className="md:col-span-2">
        <div className="w-full rounded-3xl bg-cream p-4">
          <p className="text-sm font-semibold text-ink">Priya wants to change Vitamin D3</p>
          <p className="mt-1 text-sm text-ink-soft">time → 9:00 AM · with breakfast</p>
          <div className="mt-3 flex gap-2">
            <span className="flex-1 rounded-full bg-primary py-2 text-center text-sm font-semibold text-white">Approve</span>
            <span className="flex-1 rounded-full py-2 text-center text-sm font-semibold text-primary ring-1 ring-primary/40">Ask my doctor</span>
          </div>
        </div>
      </Tile>

      <Tile title="One-tap email links" body="Signed, single-use and valid for 12 hours. “I took it” works straight from the inbox." className="md:col-span-2">
        <div className="w-full rounded-3xl bg-cream p-4">
          <p className="text-xs text-muted">To: Lakshmi · 9:00 AM</p>
          <p className="mt-1 text-sm font-semibold text-ink">Kamala hasn’t marked Amlodipine (8:00 AM)</p>
          <div className="mt-3 flex gap-2">
            <span className="rounded-full bg-primary px-3.5 py-2 text-sm font-semibold text-white">Kamala took it</span>
            <span className="rounded-full px-3.5 py-2 text-sm font-semibold text-primary ring-1 ring-primary/40">I’ve handled it</span>
          </div>
        </div>
      </Tile>

      <Tile title="A brief for the doctor" body="Adherence, side effects and skip reasons, rewritten in plain language with Google Gemini." className="md:col-span-2" tone="bg-[linear-gradient(160deg,#FFFDF9_0%,#F6E3D3_100%)]">
        <div className="w-full rounded-3xl bg-paper p-4 shadow-[var(--lift-1)]">
          <div className="flex items-center justify-between">
            <p className="font-serif text-lg font-semibold text-ink">Dr. Meera Nair</p>
            <span className="rounded-full bg-sage px-2.5 py-1 text-[11px] font-semibold text-primary">Gemini</span>
          </div>
          <div className="mt-3 space-y-2">
            <span className="block h-2 w-full rounded-full bg-[#EDE6DA]" />
            <span className="block h-2 w-4/5 rounded-full bg-[#EDE6DA]" />
            <span className="block h-2 w-3/5 rounded-full bg-accent/60" />
          </div>
          <p className="mt-3 text-sm text-ink-soft">85% of doses taken · 2 side effects</p>
        </div>
      </Tile>

      <Tile title="Her language, read aloud" body="The elder’s screen speaks six Indian languages, with large text and a read-aloud button." className="md:col-span-6" tone="bg-green-deep on-dark !text-white [&_h3]:!text-white [&_p]:!text-[#D7E4DC]">
        <div className="flex w-full flex-wrap items-center gap-3">
          {[
            ["नमस्ते", "hi"],
            ["வணக்கம்", "ta"],
            ["నమస్కారం", "te"],
            ["ನಮಸ್ಕಾರ", "kn"],
            ["നമസ്കാരം", "ml"],
            ["Namaste", "en"],
          ].map(([w, l]) => (
            <span key={l} lang={l} className="rounded-full bg-white/10 px-5 py-2.5 font-serif text-xl text-white ring-1 ring-white/20 sm:text-2xl">
              {w}
            </span>
          ))}
        </div>
      </Tile>
    </div>
  );
}
