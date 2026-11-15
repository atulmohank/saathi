import { TimeMachineControls } from "../TimeMachine";
import { TimelineReveal } from "../motion";
import type { escalationFeed, recentEmails } from "@/lib/demo-feed";

/** Demo-only "time machine": simulate missed doses, run the scheduler, reset; shows the escalation timeline and email previews. */
export function TimeMachinePanel({ feed, emails }: { feed: Awaited<ReturnType<typeof escalationFeed>>; emails: Awaited<ReturnType<typeof recentEmails>> }) {
  return (
    <section
      aria-labelledby="tm-h"
      className="relative overflow-hidden rounded-[40px] border border-[#F0D9BF] bg-[linear-gradient(150deg,#FFF6E6_0%,#F6E3D3_60%,#FBF7F0_100%)] p-5 shadow-[var(--lift-1)] sm:p-8"
    >
      <span
        aria-hidden="true"
        data-text="Demo"
        className="outline-title absolute -right-4 -top-6 hidden text-[8rem] text-saffron-ink/15 before:content-[attr(data-text)] lg:block"
      />
      <h2 id="tm-h" className="h-section relative flex items-center gap-3">
        <span aria-hidden="true" className="grid size-10 place-items-center rounded-full bg-accent text-lg">
          ⏩
        </span>{" "}
        Time machine
      </h2>
      <p className="mt-1 text-sm text-[#3D4A43]">
        Demo circle only. Plays out a missed dose through each care mode&apos;s escalation ladder. Real emails go only to the demo test inbox.
      </p>
      <div className="mt-4">
        <TimeMachineControls />
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div>
          <h3 className="font-semibold">Escalation timeline</h3>
          {feed.length === 0 ? (
            <p className="mt-2 text-sm text-muted">Nothing yet. Simulate a missed dose.</p>
          ) : (
            feed.map(({ title, items }, i) => (
              <div key={i} className="mt-3">
                <p className="text-sm font-semibold text-primary">{title}</p>
                <TimelineReveal
                  className="mt-3"
                  stagger={0.35}
                  label={`Escalation steps for ${title}`}
                  steps={items.map((it) => ({
                    time: it.time,
                    title: it.text,
                    detail: it.severity ? `${it.severity === "urgent" ? "Urgent" : "Gentle"} email` : undefined,
                    tone: it.kind === "resolved" ? "resolved" : it.kind === "start" ? "info" : it.severity === "urgent" ? "urgent" : "gentle",
                  }))}
                />
              </div>
            ))
          )}
        </div>
        <div>
          <h3 className="font-semibold">Email previews</h3>
          {emails.length === 0 ? (
            <p className="mt-2 text-sm text-muted">No emails yet.</p>
          ) : (
            <ul className="mt-3 flex flex-col gap-2" role="list">
              {emails.map((em) => (
                <li key={em.id}>
                  <details className="card p-3 text-sm">
                    <summary className="min-h-11 cursor-pointer content-center font-medium">
                      {em.subject}
                      <span className={`ml-2 badge text-xs ${em.sent ? "bg-[#E4F1E8] text-success" : "bg-[#FBEDEC] text-danger"}`}>
                        {em.sent ? "sent" : "not sent"}
                      </span>
                    </summary>
                    <pre className="mt-2 whitespace-pre-wrap break-words font-sans text-sm text-ink">
                      {em.body_text.replace(/https?:\/\/\S+/g, "[one-time link]")}
                    </pre>
                  </details>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
