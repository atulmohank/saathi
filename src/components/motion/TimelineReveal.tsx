"use client";

/**
 * <TimelineReveal /> — escalation timeline. Steps appear one by one while the
 * connecting line draws downward between them.
 * prefers-reduced-motion → everything is simply there.
 * Only dependency: framer-motion.
 */
import { m, type Variants } from "framer-motion";
import { useStill } from "./useStill";

export type TimelineTone = "info" | "gentle" | "urgent" | "resolved";

export type TimelineStep = {
  time: string;
  title: string;
  detail?: string;
  tone?: TimelineTone;
};

export type TimelineRevealProps = {
  steps: TimelineStep[];
  /** Seconds between steps. Slow by default. */
  stagger?: number;
  /** Accessible name for the list. */
  label?: string;
  className?: string;
};

const DOT: Record<TimelineTone, string> = {
  info: "#1F5C4A",
  gentle: "#E8A33D",
  urgent: "#B3261E",
  resolved: "#2E7D4F",
};

export function TimelineReveal({ steps, stagger = 0.55, label = "What happened, step by step", className }: TimelineRevealProps) {
  const still = useStill();

  const list: Variants = { hidden: {}, show: { transition: { staggerChildren: stagger, delayChildren: 0.15 } } };
  const row: Variants = {
    hidden: { opacity: 0, y: 14 },
    show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 0.8, 0.26, 1] } },
  };
  const dot: Variants = {
    hidden: { scale: 0.4, opacity: 0 },
    show: { scale: 1, opacity: 1, transition: { type: "spring", stiffness: 120, damping: 14 } },
  };
  const line: Variants = {
    hidden: { scaleY: 0 },
    show: { scaleY: 1, transition: { duration: stagger * 1.1, ease: "easeInOut", delay: 0.25 } },
  };

  return (
    <m.ol
      aria-label={label}
      className={className}
      style={{ listStyle: "none", margin: 0, padding: 0, color: "#1F2A24" }}
      variants={list}
      initial={still ? false : "hidden"}
      whileInView="show"
      viewport={{ once: true, amount: 0.3 }}
    >
      {steps.map((s, i) => {
        const tone = s.tone ?? "info";
        const last = i === steps.length - 1;
        return (
          <m.li key={`${s.time}-${s.title}`} variants={row} style={{ display: "grid", gridTemplateColumns: "28px 1fr", columnGap: 16 }}>
            <div style={{ position: "relative", display: "flex", justifyContent: "center" }} aria-hidden="true">
              {!last && (
                <m.span
                  variants={line}
                  style={{ position: "absolute", top: 24, bottom: -4, width: 3, borderRadius: 3, background: "#D9D3C4", transformOrigin: "top" }}
                />
              )}
              <m.span
                variants={dot}
                style={{
                  position: "relative",
                  marginTop: 2,
                  width: 22,
                  height: 22,
                  borderRadius: 11,
                  background: DOT[tone],
                  boxShadow: "0 0 0 5px #FBF7F0",
                  display: "grid",
                  placeItems: "center",
                }}
              >
                {tone === "resolved" && (
                  <svg viewBox="0 0 22 22" width="22" height="22">
                    <path d="M6.5 11.5l3 3 6-6.5" fill="none" stroke="#FBF7F0" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </m.span>
            </div>
            <div style={{ paddingBottom: last ? 0 : 28 }}>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: tone === "urgent" ? "#B3261E" : "#1F5C4A" }}>{s.time}</p>
              <p style={{ margin: "2px 0 0", fontSize: 18, fontWeight: 600, lineHeight: 1.35 }}>{s.title}</p>
              {s.detail && <p style={{ margin: "4px 0 0", fontSize: 16, lineHeight: 1.5, color: "#5A6358" }}>{s.detail}</p>}
            </div>
          </m.li>
        );
      })}
    </m.ol>
  );
}

export default TimelineReveal;
