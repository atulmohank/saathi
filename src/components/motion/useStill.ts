"use client";

import { useEffect, useState } from "react";
import { useReducedMotion } from "framer-motion";

/**
 * prefers-reduced-motion, hydration-safe: false on the server and on the first
 * client render (so SSR HTML matches), then the user's real preference.
 * <MotionProvider> (MotionConfig reducedMotion="user") keeps that first frame still too.
 */
export function useStill(): boolean {
  const reduced = useReducedMotion() ?? false;
  const [mounted, setMounted] = useState(false);
  // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time mount flag for hydration safety
  useEffect(() => setMounted(true), []);
  return mounted && reduced;
}
