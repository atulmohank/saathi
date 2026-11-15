import { NextResponse } from "next/server";
import { applyAction, type ActionOutcome } from "@/lib/action-effects";
import { redeem } from "@/lib/action-links";

export const dynamic = "force-dynamic";

/** Redeems a single-use email action token (form POST from /a/[token]). */
export async function POST(req: Request) {
  let outcome: ActionOutcome = "invalid";
  try {
    const form = await req.formData();
    const token = String(form.get("token") ?? "");
    const claims = token ? await redeem(token) : null;
    outcome = claims ? await applyAction(claims) : "invalid";
  } catch (e) {
    console.error(e);
    outcome = "invalid";
  }
  return NextResponse.redirect(new URL(`/a/done?r=${outcome}`, req.url), 303);
}
