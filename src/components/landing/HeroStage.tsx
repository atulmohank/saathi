"use client";

/* eslint-disable @next/next/no-img-element -- art-directed hero photo with a fixed crop */
import { motion } from "framer-motion";
import { useStill } from "../motion/useStill";
import { PhoneMock } from "./PhoneMock";

const EASE = [0.22, 0.8, 0.26, 1] as const;

const chips = [
  { text: "Metformin taken · 8:02", icon: "✓", tone: "bg-success text-white", pos: "left-0 top-[1%] sm:left-[-14%] sm:top-[18%]" },
  { text: "Email sent to Lakshmi · 9:00", icon: "✉", tone: "bg-accent text-ink", pos: "hidden sm:flex right-[-4%] top-[44%] sm:right-[-8%]" },
  { text: "95% this week", icon: "◔", tone: "bg-primary text-white", pos: "right-0 bottom-[6%] sm:right-auto sm:left-[44%] sm:bottom-[-2%]" },
];

/** The one orchestrated moment on the page: arch photo, phone and chips settle in once. */
export function HeroStage() {
  const still = useStill();
  // Always animate to the final state; with reduced motion it is instant (never left at opacity 0).
  const enter = (delay: number, y = 24) => ({
    initial: { opacity: 0, y },
    animate: { opacity: 1, y: 0 },
    transition: still ? { duration: 0 } : { duration: 0.9, ease: EASE, delay },
  });

  return (
    <div className="relative mx-auto mt-6 aspect-[4/5] w-full max-w-[520px] sm:mt-0 sm:aspect-[5/6]">
      {/* saffron sun */}
      <div aria-hidden="true" className="absolute right-[6%] top-[2%] size-[46%] rounded-full bg-[radial-gradient(circle_at_40%_40%,#F6C979_0%,#E8A33D_60%,#E8A33D_100%)] opacity-90" />
      <div aria-hidden="true" className="blob -left-10 bottom-10 size-64 bg-sage opacity-80" />

      {/* grandmother in an arch */}
      <motion.div {...enter(0.1, 16)} className="absolute right-0 top-[8%] h-[80%] w-[70%] overflow-hidden rounded-t-full rounded-b-[40px] shadow-[var(--lift-2)] ring-[6px] ring-paper">
        <img
          src="/images/kamala-arch.webp"
          alt="A smiling grandmother in a pink floral sari and glasses, standing in a sunny garden"
          width={1000}
          height={1250}
          fetchPriority="high"
          className="h-full w-full object-cover object-[50%_20%]"
        />
      </motion.div>

      {/* the product, overlapping the photo and the wordmark below */}
      <motion.div {...enter(0.35, 40)} className="absolute bottom-[-6%] left-0 z-10 w-[250px] origin-bottom-left rotate-[-4deg] scale-[0.72] sm:bottom-[-14%] sm:left-[2%] sm:scale-100">
        <PhoneMock />
      </motion.div>

      {/* glass chips: what the circle sees */}
      <div role="list" aria-label="What the care circle sees" className="absolute inset-0 z-20">
        {chips.map((c, i) => (
          <motion.div key={c.text} role="listitem" {...enter(0.7 + i * 0.18, 12)} className={`glass absolute flex items-center gap-2 py-2 pl-2 pr-3.5 text-[13px] font-semibold text-ink sm:text-sm ${c.pos}`}>
            <span aria-hidden="true" className={`grid size-7 place-items-center rounded-full text-sm ${c.tone}`}>
              {c.icon}
            </span>
            {c.text}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
