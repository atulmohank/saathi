import { Lockup } from "@/components/Lockup";
import Link from "next/link";

export const metadata = { title: "Done — Saathi", robots: { index: false } };

const MSG: Record<string, { h: string; p: string; ok: boolean }> = {
  taken: { h: "Thank you — marked as taken.", p: "Everyone in the care circle can see it now. No more reminders for this dose.", ok: true },
  handled: { h: "Thank you — you've handled it.", p: "Nobody else will be alerted about this dose.", ok: true },
  approved: { h: "Change approved.", p: "The new medicine plan is in place, and everyone in the circle can see it.", ok: true },
  already: { h: "Already taken care of.", p: "Someone has already updated this. Nothing else to do.", ok: true },
  denied: { h: "This action isn't available to you.", p: "Please open Saathi or ask the care circle.", ok: false },
  invalid: { h: "This link has expired or was already used.", p: "Links from Saathi emails work once, for 12 hours. Please open Saathi instead.", ok: false },
};

export default async function Done({ searchParams }: { searchParams: Promise<{ r?: string }> }) {
  const { r } = await searchParams;
  const m = MSG[r ?? ""] ?? MSG.invalid;
  return (
    <main id="main" className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center px-4 py-16 text-[20px]">
      <Lockup href="/" />
      <div className="card mt-6 p-8" role="status">
        <p aria-hidden="true" className={`grid size-16 place-items-center rounded-full text-3xl text-white ${m.ok ? "bg-success" : "bg-muted"}`}>
          {m.ok ? "✓" : "!"}
        </p>
        <h1 className="mt-6 font-serif text-3xl">{m.h}</h1>
        <p className="mt-4">{m.p}</p>
        <Link href="/" className="btn-secondary mt-8">
          Open Saathi
        </Link>
      </div>
    </main>
  );
}
