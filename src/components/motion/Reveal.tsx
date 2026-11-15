"use client";

/**
 * Section entrances: fade + rise as things scroll into view.
 *   <Reveal>…</Reveal>                         one block
 *   <RevealGroup><RevealItem/>…</RevealGroup>  children arrive one after another
 * prefers-reduced-motion → content is visible immediately, no movement.
 * Only dependency: framer-motion.
 */
import type { ReactNode } from "react";
import { motion, type Variants } from "framer-motion";
import { useStill } from "./useStill";

const EASE = [0.22, 0.8, 0.26, 1] as const;

export type RevealProps = {
  children: ReactNode;
  /** Seconds to wait before starting. */
  delay?: number;
  /** How far it rises, in px. */
  rise?: number;
  className?: string;
};

export function Reveal({ children, delay = 0, rise = 24, className }: RevealProps) {
  const still = useStill();
  return (
    <motion.div
      className={className}
      initial={still ? false : { opacity: 0, y: rise }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 0.9, ease: EASE, delay }}
    >
      {children}
    </motion.div>
  );
}

const group = (stagger: number): Variants => ({ hidden: {}, show: { transition: { staggerChildren: stagger } } });
const item = (rise: number): Variants => ({
  hidden: { opacity: 0, y: rise },
  show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: EASE } },
});

export function RevealGroup({ children, stagger = 0.14, className }: { children: ReactNode; stagger?: number; className?: string }) {
  const still = useStill();
  return (
    <motion.div
      className={className}
      variants={group(stagger)}
      initial={still ? false : "hidden"}
      whileInView="show"
      viewport={{ once: true, amount: 0.2 }}
    >
      {children}
    </motion.div>
  );
}

export function RevealItem({ children, rise = 20, className }: { children: ReactNode; rise?: number; className?: string }) {
  return (
    <motion.div className={className} variants={item(rise)}>
      {children}
    </motion.div>
  );
}

export default Reveal;
