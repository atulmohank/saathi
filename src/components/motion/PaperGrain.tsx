/**
 * <PaperGrain /> — a barely-there paper texture over the cream background.
 * One tiny SVG noise tile (rasterised once by the browser). Static on purpose: an endlessly
 * drifting full-viewport layer cost repaints and hurt Speed Index. Sits behind content,
 * blocks nothing: pointer-events none, aria-hidden. Needs CSP `img-src 'self' data:`.
 */
const TILE =
  "<svg xmlns='http://www.w3.org/2000/svg' width='220' height='220'>" +
  "<filter id='n' x='0' y='0' width='100%' height='100%'>" +
  "<feTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/>" +
  "<feColorMatrix values='0 0 0 0 .12 0 0 0 0 .16 0 0 0 0 .14 1.3 0 0 0 -.52'/>" +
  "</filter><rect width='100%' height='100%' filter='url(#n)'/></svg>";
const GRAIN = `url("data:image/svg+xml,${encodeURIComponent(TILE)}")`;

export type PaperGrainProps = {
  /** 0–1. Keep it low; this should be felt, not seen. */
  opacity?: number;
  /** "fixed" covers the viewport; "absolute" covers the nearest positioned parent. */
  position?: "fixed" | "absolute";
  zIndex?: number;
  className?: string;
};

export function PaperGrain({ opacity = 0.2, position = "fixed", zIndex = 1, className }: PaperGrainProps) {
  return (
    <div
      aria-hidden="true"
      className={className}
      style={{ position, inset: 0, pointerEvents: "none", zIndex, backgroundImage: GRAIN, backgroundSize: "220px 220px", opacity, mixBlendMode: "multiply" }}
    />
  );
}

export default PaperGrain;
