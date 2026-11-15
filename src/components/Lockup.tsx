/* eslint-disable @next/next/no-img-element -- static brand SVG */
import Link from "next/link";

/** Saathi mark + wordmark for app headers. */
export function Lockup({ href, height = 36 }: { href?: string; height?: number }) {
  const img = <img src="/brand/saathi-lockup.svg" alt="Saathi" height={height} width={Math.round(height * 3.5)} style={{ height, width: "auto" }} />;
  return href ? (
    <Link href={href} className="inline-flex min-h-11 items-center" aria-label="Saathi home">
      {img}
    </Link>
  ) : (
    img
  );
}
