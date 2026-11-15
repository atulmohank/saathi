import { PageShell } from "@/components/PageShell";
import Link from "next/link";
import { verifyActionToken } from "@/lib/auth/jwt";
import { env } from "@/lib/env";

export const dynamic = "force-dynamic";
export const metadata = { title: "Confirm — Saathi", referrer: "no-referrer", robots: { index: false } };

const PROMPT = {
  dose_taken: { heading: "Mark this dose as taken?", button: "Yes, it was taken" },
  handled: { heading: "Tell everyone you've handled it?", button: "Yes, I've handled it" },
  approve_change: { heading: "Approve this medicine change?", button: "Yes, approve the change" },
} as const;

/**
 * GET only shows a confirm button. Email scanners prefetch links, so a GET must
 * never consume a single-use token; the POST does.
 */
export default async function ActionPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const claims = await verifyActionToken(token, env().ACTION_LINK_SECRET);
  return (
    <PageShell>
    <main id="main" className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center px-4 py-16 text-[20px]">
      {claims ? (
        <form method="post" action="/api/action" className="card mt-6 p-8">
          <h1 className="font-serif text-3xl">{PROMPT[claims.purpose].heading}</h1>
          <input type="hidden" name="token" value={token} />
          <button type="submit" className="btn-primary mt-8 min-h-16 w-full text-[22px]">
            {PROMPT[claims.purpose].button}
          </button>
        </form>
      ) : (
        <div className="card mt-6 p-8">
          <h1 className="font-serif text-3xl">This link has expired</h1>
          <p className="mt-4">Links from Saathi emails work for 12 hours. Please open Saathi to update the dose.</p>
          <Link href="/" className="btn-secondary mt-6">
            Open Saathi
          </Link>
        </div>
      )}
    </main>
    </PageShell>
  );
}
