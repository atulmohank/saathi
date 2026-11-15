"use client";

/**
 * <PaperGrain /> — a barely-there paper texture over the cream background.
 * One tiny SVG noise tile (rasterised once by the browser), drifting very slowly.
 * Sits behind nothing and blocks nothing: pointer-events none, aria-hidden.
 * prefers-reduced-motion → the grain stays, the drift stops.
 * Only dependency: framer-motion. If you ship a CSP, allow `img-src 'self' data:`.
 */
import { motion } from "framer-motion";
import { useStill } from "./useStill";

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
  const still = useStill();
  return (
    <div aria-hidden="true" className={className} style={{ position, inset: 0, overflow: "hidden", pointerEvents: "none", zIndex }}>
      <motion.div
        style={{ position: "absolute", inset: -80, backgroundImage: GRAIN, backgroundSize: "220px 220px", opacity, mixBlendMode: "multiply", willChange: "transform" }}
        animate={still ? undefined : { x: [0, -36, 18, 0], y: [0, 24, -30, 0] }}
        transition={{ duration: 60, ease: "linear", repeat: Infinity }}
      />
    </div>
  );
}

export default PaperGrain;
