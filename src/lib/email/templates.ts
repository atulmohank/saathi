/**
 * Pure email templates: accessible HTML (semantic, high contrast, large text,
 * real buttons as links, lang attribute) + plain-text alternative.
 * Every interpolated value is HTML-escaped.
 */

export interface Email {
  subject: string;
  text: string;
  html: string;
}

export const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

interface Action {
  label: string;
  url: string;
}

function layout(opts: { preheader: string; heading: string; paragraphs: string[]; actions: Action[]; footer: string }): string {
  const ps = opts.paragraphs.map((p) => `<p style="margin:0 0 16px;font-size:18px;line-height:1.5;color:#1F2A24">${esc(p)}</p>`).join("");
  const btns = opts.actions
    .map(
      (a, i) =>
        `<a href="${esc(a.url)}" style="display:inline-block;margin:0 12px 12px 0;padding:14px 24px;border-radius:10px;font-size:18px;font-weight:600;text-decoration:none;${
          i === 0 ? "background:#1F5C4A;color:#FFFFFF;border:2px solid #1F5C4A" : "background:#FFFFFF;color:#1F5C4A;border:2px solid #1F5C4A"
        }">${esc(a.label)}</a>`,
    )
    .join("");
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(opts.heading)}</title></head>
<body style="margin:0;padding:0;background:#FBF7F0;font-family:Arial,Helvetica,sans-serif">
<div style="display:none;max-height:0;overflow:hidden">${esc(opts.preheader)}</div>
<main role="main" style="max-width:560px;margin:0 auto;padding:24px">
<p style="margin:0 0 8px;font-size:16px;color:#1F5C4A;font-weight:700">Saathi</p>
<div style="background:#FFFFFF;border:1px solid #E6DFD8;border-radius:16px;padding:24px">
<h1 style="margin:0 0 16px;font-size:24px;line-height:1.3;color:#1F2A24">${esc(opts.heading)}</h1>
${ps}
${btns ? `<div style="margin-top:8px">${btns}</div>` : ""}
</div>
<p style="margin:16px 0 0;font-size:14px;line-height:1.5;color:#4F5A52">${esc(opts.footer)}</p>
</main></body></html>`;
}

function textBody(heading: string, paragraphs: string[], actions: Action[], footer: string): string {
  return [heading, "", ...paragraphs, "", ...actions.map((a) => `${a.label}: ${a.url}`), "", footer].join("\n");
}

const FOOTER = "Links work once and expire within 12 hours. You get this because you are in a Saathi care circle.";

function build(subject: string, heading: string, paragraphs: string[], allActions: Action[]): Email {
  const actions = allActions.filter((a) => a.url); // a role that may not act gets no button
  return {
    subject,
    text: textBody(heading, paragraphs, actions, FOOTER),
    html: layout({ preheader: paragraphs[0] ?? heading, heading, paragraphs, actions, footer: FOOTER }),
  };
}

export function upcomingDoseEmail(p: { toName: string; elderName: string; forElder: boolean; medName: string; dose: string; time: string; instructions: string; takenUrl: string }): Email {
  const who = p.forElder ? "your" : `${p.elderName}'s`;
  return build(
    `Reminder: ${p.medName} at ${p.time}`,
    `Time for ${who} ${p.medName} at ${p.time}`,
    [
      `Hello ${p.toName}, this is a gentle reminder.`,
      `${p.medName}, ${p.dose}.${p.instructions ? ` ${p.instructions}.` : ""}`,
    ],
    [{ label: p.forElder ? "I took it" : `${p.elderName} took it`, url: p.takenUrl }],
  );
}

export function missedDoseEmail(p: {
  toName: string;
  elderName: string;
  forElder: boolean;
  medName: string;
  dose: string;
  time: string;
  minutesLate: number;
  severity: "info" | "gentle" | "urgent";
  isCritical: boolean;
  alreadyTold: string[];
  takenUrl: string;
  handledUrl: string;
}): Email {
  const late = p.minutesLate >= 60 ? `${Math.round(p.minutesLate / 6) / 10} hours` : `${Math.round(p.minutesLate)} minutes`;
  const subject = p.forElder
    ? `Did you take your ${p.medName}?`
    : `${p.severity === "urgent" ? "Please check: " : ""}${p.elderName} hasn't marked ${p.medName} (${p.time})`;
  const paras = p.forElder
    ? [`Hello ${p.toName}, your ${p.time} ${p.medName} (${p.dose}) isn't marked yet.`, "If you've taken it, tap the button. If not, that's all right — open Saathi and tell us why."]
    : [
        `Hello ${p.toName}, ${p.elderName}'s ${p.time} dose of ${p.medName} (${p.dose}) is ${late} late and not marked.`,
        p.isCritical ? `${p.medName} is marked as critical.` : "",
        p.alreadyTold.length ? `Already told: ${p.alreadyTold.join(", ")}.` : "",
        "If someone has taken care of it, tap “I've handled it” so nobody else is alerted.",
      ].filter(Boolean);
  const actions: Action[] = p.forElder
    ? [{ label: "I took it", url: p.takenUrl }]
    : [
        { label: `${p.elderName} took it`, url: p.takenUrl },
        { label: "I've handled it", url: p.handledUrl },
      ];
  return build(subject, subject, paras, actions);
}

export function appointmentEmail(p: { toName: string; elderName: string; forElder: boolean; doctor: string; specialty: string; when: string; location: string; window: "24h" | "2h" }): Email {
  const whose = p.forElder ? "Your" : `${p.elderName}'s`;
  const soon = p.window === "2h" ? "in about 2 hours" : "tomorrow";
  return build(
    `${whose} visit to ${p.doctor} is ${soon}`,
    `${whose} visit to ${p.doctor} is ${soon}`,
    [`Hello ${p.toName}.`, `${p.doctor}${p.specialty ? ` (${p.specialty})` : ""} · ${p.when}${p.location ? ` · ${p.location}` : ""}.`, "Bring the medicine list and any questions about side effects."],
    [],
  );
}

export function proposalEmail(p: { toName: string; elderName: string; forElder: boolean; proposer: string; medName: string; summary: string; approveUrl: string; reviewUrl: string }): Email {
  const whose = p.forElder ? "your" : `${p.elderName}'s`;
  return build(
    `${p.proposer} wants to change ${whose} ${p.medName}`,
    `${p.proposer} wants to change ${whose} ${p.medName}`,
    [`Hello ${p.toName}.`, `Proposed change: ${p.summary}.`, "Nothing changes until you approve. You can also ask the doctor first."],
    [
      { label: "Approve change", url: p.approveUrl },
      { label: "Review in Saathi", url: p.reviewUrl },
    ],
  );
}
