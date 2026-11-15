import "server-only";
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { AuthError } from "./auth/guard";

/** Uniform error mapping for route handlers; never leaks internals. */
export function handleError(e: unknown): NextResponse {
  if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.status });
  if (e instanceof ZodError) {
    return NextResponse.json({ error: "Invalid input", issues: e.issues.map((i) => ({ path: i.path, message: i.message })) }, { status: 400 });
  }
  console.error(e);
  return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
}

export async function readJson(req: Request, maxBytes = 16_000): Promise<unknown> {
  const text = await req.text();
  if (text.length > maxBytes) return null; // fails schema validation → 400
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}
