"use client";

import type { ReactNode } from "react";
import { MotionConfig } from "framer-motion";

/** Framer Motion follows the OS "reduce motion" setting everywhere (transforms jump to their end state). */
export function MotionProvider({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
