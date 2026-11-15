import { NextResponse } from "next/server";
import { z } from "zod";
import { geminiBrief, loadBrief } from "@/lib/brief-server";
import { handleError, readJson } from "@/lib/http";
import { uuid } from "@/lib/validation";

export const maxDuration = 60;

/** POST /api/brief — Doctor Visit Brief in plain language (Gemini with template fallback); view permission required. */
export async function POST(req: Request) {
  try {
    const { appointmentId } = z.object({ appointmentId: uuid }).parse(await readJson(req));
    const b = await loadBrief(appointmentId);
    if (!b) return NextResponse.json({ error: "Not found." }, { status: 404 });
    const plain = await geminiBrief(b.template, b.elder.display_name, b.elder.preferred_language);
    return NextResponse.json({ ...plain, lang: b.elder.preferred_language });
  } catch (e) {
    return handleError(e);
  }
}
