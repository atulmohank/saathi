import "server-only";
import nodemailer, { type Transporter } from "nodemailer";
import { db } from "../db";
import { env } from "../env";
import type { Email } from "./templates";

let transport: Transporter | null = null;
function smtp(): Transporter | null {
  const e = env();
  if (!e.GMAIL_USER || !e.GMAIL_APP_PASSWORD) return null;
  transport ??= nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    requireTLS: true,
    auth: { user: e.GMAIL_USER, pass: e.GMAIL_APP_PASSWORD },
  });
  return transport;
}

export interface Recipient {
  memberId: string;
  name: string;
  email: string | null;
}

/**
 * Records the email in email_outbox (for in-app previews) and sends it.
 * Demo circles NEVER email real people: everything goes to DEMO_EMAIL_SINK.
 */
export async function sendEmail(args: { circleId: string; isDemo: boolean; to: Recipient; kind: string; email: Email }): Promise<{ sent: boolean }> {
  const e = env();
  const address = args.isDemo ? e.DEMO_EMAIL_SINK : args.to.email;
  const subject = args.isDemo ? `[Saathi demo → ${args.to.name}] ${args.email.subject}` : args.email.subject;

  const { data: row } = await db()
    .from("email_outbox")
    .insert({ circle_id: args.circleId, to_member: args.to.memberId, kind: args.kind, subject, body_text: args.email.text, body_html: args.email.html })
    .select("id")
    .single();

  const t = smtp();
  if (!address || !t) {
    await db().from("email_outbox").update({ error: "no address or SMTP not configured" }).eq("id", row?.id);
    return { sent: false };
  }
  try {
    await t.sendMail({ from: `Saathi <${e.GMAIL_USER}>`, to: address, subject, text: args.email.text, html: args.email.html });
    await db().from("email_outbox").update({ sent: true }).eq("id", row?.id);
    return { sent: true };
  } catch (err) {
    await db()
      .from("email_outbox")
      .update({ error: String((err as Error).message ?? err).slice(0, 300) })
      .eq("id", row?.id);
    return { sent: false };
  }
}
