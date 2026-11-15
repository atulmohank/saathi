/* eslint-disable @next/next/no-img-element -- fixed-crop avatar and brand SVG */
import Link from "next/link";
import { SignOut } from "../SignOut";
import type { ElderRow } from "@/lib/data";

/** Deep-green band at the top of the family/caretaker dashboard: brand bar, elder photo, name, mode, elder switcher. */
export function DashboardHeader({
  id,
  circleName,
  actorName,
  roleLabel,
  elder,
  elders,
  photo,
  mode,
}: {
  id: string;
  circleName: string;
  actorName: string;
  roleLabel: string;
  elder: ElderRow;
  elders: ElderRow[];
  photo: string | null;
  mode: { label: string; line: string };
}) {
  return (
      <header className="on-dark relative overflow-hidden bg-green-deep pb-28 text-[#D7E4DC]">
        <div aria-hidden="true" className="blob -right-24 -top-32 size-96 bg-accent opacity-20" />
        <div aria-hidden="true" className="blob -bottom-40 left-1/4 size-[28rem] bg-primary opacity-60" />
        <div className="wrap relative flex flex-wrap items-center justify-between gap-3 py-5">
          <div className="flex items-center gap-3">
            <img src="/brand/saathi-lockup-light.svg" alt="Saathi" width={112} height={34} className="h-8 w-auto" />
            <span className="hidden text-sm text-[#B9CCC2] sm:inline">{circleName}</span>
          </div>
          <div className="flex flex-wrap items-center gap-x-1 gap-y-1 text-sm">
            <Link href={`/circle/${id}/emergency?elder=${elder.id}`} className="btn-ghost text-white">
              Emergency card
            </Link>
            <Link href={`/circle/${id}/audit`} className="btn-ghost text-white">
              Audit trail
            </Link>
            <span className="hidden px-2 md:inline">
              Signed in as <strong className="text-white">{actorName}</strong> · {roleLabel}
            </span>
            <SignOut className="!text-white" />
          </div>
        </div>
  
        <div className="wrap relative mt-4 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex items-center gap-5">
            {photo ? (
              <img src={photo} alt="" width={112} height={112} className="size-20 shrink-0 rounded-full object-cover ring-4 ring-white/25 sm:size-28" />
            ) : (
              <span aria-hidden="true" className="grid size-20 shrink-0 place-items-center rounded-full bg-primary font-serif text-4xl text-white ring-4 ring-white/25 sm:size-28">
                {elder.display_name.slice(0, 1)}
              </span>
            )}
            <div>
              <h1 id="who-h" className="text-[2.5rem] font-medium leading-none text-white sm:text-[3.5rem]" style={{ fontVariationSettings: '"opsz" 36' }}>
                {elder.display_name}
                {elder.age ? <span className="text-[#9FB8AC]">, {elder.age}</span> : null}
              </h1>
              <p className="mt-3 flex flex-wrap items-center gap-2">
                <span className="badge bg-white/12 text-white ring-1 ring-white/25">{mode.label} mode</span>
                <span className="text-[#D7E4DC]">{mode.line.replaceAll("{name}", elder.display_name)}</span>
              </p>
            </div>
          </div>
          {elders.length > 1 && (
            <nav aria-label="Choose elder" className="flex gap-2">
              {elders.map((e) => (
                <Link
                  key={e.id}
                  href={`?elder=${e.id}`}
                  aria-current={e.id === elder.id ? "page" : undefined}
                  className={`inline-flex min-h-11 items-center rounded-full px-5 font-semibold transition-colors ${e.id === elder.id ? "bg-accent text-ink" : "bg-white/10 text-white ring-1 ring-white/25 hover:bg-white/20"}`}
                >
                  {e.display_name}
                </Link>
              ))}
            </nav>
          )}
        </div>
      </header>
  );
}
