"use client";

import type { ReactNode } from "react";
import { domAnimation, LazyMotion, MotionConfig } from "framer-motion";

/**
 * Framer Motion, loaded lean: LazyMotion + domAnimation (no drag/layout features), and every
 * animation follows the OS "reduce motion" setting (transforms jump to their end state).
 * Components use the `m.*` elements, which need this provider.
 */
export function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <LazyMotion features={domAnimation} strict>
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </LazyMotion>
  );
}
