"use client";

/**
 * <ScrollStory /> — "one missed dose, zero panic", told in 4 scroll steps.
 * A tall section with a pinned stage. Scroll drives the step and the escalation
 * line that draws Kamala → Priya → doctor brief.
 * prefers-reduced-motion → no pinning: the finished picture + all four steps as a plain list.
 * Needs: framer-motion, Tailwind, and the avatars at {assetBase}/avatars/*.svg.
 */
import { useRef, useState } from "react";
import {
  motion,
  useMotionValueEvent,

  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from "framer-motion";
import { useStill } from "./useStill";

export type StoryStep = { time: string; title: string; body: string };

export const DEFAULT_STORY: StoryStep[] = [
  {
    time: "8:00",
    title: "Reminder sent",
    body: "Kamala gets one calm nudge for her morning tablet. Nobody else is disturbed.",
  },
  {
    time: "8:30",
    title: "Not taken — Kamala taps “Ran out”",
    body: "One big button. She says why in a single tap, and Saathi listens to the reason.",
  },
  {
    time: "8:31",
    title: "Refill task goes to Priya. No panic.",
    body: "Ran out is not an emergency, so no alarm ladder. Priya simply gets a refill to pick up.",
  },
  {
    time: "Thursday",
    title: "Doctor brief ready",
    body: "The missed dose, the reason and the refill are already written up for Thursday’s visit.",
  },
];

const C = {
  cream: "#FBF7F0",
  ink: "#1F2A24",
  green: "#1F5C4A",
  saffron: "#E8A33D",
  pale: "#F6DDB0",
  success: "#2E7D4F",
  muted: "#5A6358",
  sand: "#F3E9D8",
} as const;

const SERIF = "var(--font-fraunces), Fraunces, Georgia, serif";
const soft = { type: "spring", stiffness: 70, damping: 18 } as const;

function Stage({
  step,
  steps,
  line1,
  line2,
  still,
}: {
  step: number;
  steps: StoryStep[];
  line1: MotionValue<number> | number;
  line2: MotionValue<number> | number;
  still: boolean;
}) {
  const show = (from: number) => ({ opacity: step >= from ? 1 : 0, y: step >= from ? 0 : 10 });
  const label = { fontSize: 15, fontWeight: 600, fill: C.ink, textAnchor: "middle" } as const;
  return (
    <svg viewBox="0 0 480 400" width="100%" style={{ display: "block", height: "auto", maxHeight: "70vh" }} aria-hidden="true">
      <circle cx="240" cy="200" r="190" fill="#F7EFE1" />

      {/* faint tracks, then the escalation line that draws over them */}
      <g fill="none" strokeLinecap="round">
        <path d="M160 196C232 190 262 96 322 90M378 172v88" stroke={C.green} strokeOpacity=".18" strokeWidth="2.5" strokeDasharray="1 9" />
        <motion.path d="M160 196C232 190 262 96 322 90" stroke={C.saffron} strokeWidth="4" style={{ pathLength: line1 }} />
        <motion.path d="M378 172v88" stroke={C.saffron} strokeWidth="4" style={{ pathLength: line2 }} />
      </g>

      {/* Kamala */}
      {!still && step === 0 && (
        <motion.circle
          cx="100"
          cy="202"
          r="54"
          fill="none"
          stroke={C.saffron}
          strokeWidth="2"
          initial={{ scale: 1, opacity: 0.4 }}
          animate={{ scale: 1.35, opacity: 0 }}
          transition={{ duration: 2.8, ease: "easeOut", repeat: Infinity, repeatDelay: 0.6 }}
        />
      )}
      <clipPath id="ss-kamala"><circle cx="100" cy="202" r="50" /></clipPath>
      <circle cx="100" cy="202" r="54" fill="#FFFDF9" />
      <image href="/images/kamala-avatar.webp" x="50" y="152" width="100" height="100" preserveAspectRatio="xMidYMid slice" clipPath="url(#ss-kamala)" />
      <text x="100" y="278" style={label}>
        Kamala
      </text>

      {/* time chip */}
      <g>
        <motion.rect x="50" y="96" width="100" height="38" rx="19" animate={{ fill: step === 0 ? "#FFFFFF" : C.pale }} transition={{ duration: 0.6 }} />
        <path d="M74 106a6.5 6.5 0 0 1 6.5 6.5v4l2.5 4h-18l2.5-4v-4A6.5 6.5 0 0 1 74 106z" fill={C.saffron} />
        <circle cx="74" cy="124" r="2.2" fill={C.saffron} />
        <text x="110" y="121" style={{ ...label, fontSize: 16 }}>
          {step === 0 ? steps[0].time : steps[1].time}
        </text>
      </g>

      {/* "Ran out" — one big button */}
      <motion.g initial={false} animate={show(1)} transition={soft}>
        <rect x="36" y="296" width="128" height="46" rx="23" fill={C.green} />
        <text x="100" y="325" style={{ ...label, fill: C.cream, fontSize: 16 }}>
          Ran out
        </text>
      </motion.g>

      {/* Caretaker on duty + refill task */}
      <motion.g initial={false} animate={{ opacity: step >= 2 ? 1 : 0.35 }} transition={{ duration: 0.8 }}>
        <clipPath id="ss-lakshmi"><circle cx="378" cy="88" r="46" /></clipPath>
        <circle cx="378" cy="88" r="50" fill="#FFFDF9" />
        <image href="/images/lakshmi-avatar.webp" x="332" y="42" width="92" height="92" preserveAspectRatio="xMidYMid slice" clipPath="url(#ss-lakshmi)" />
        <text x="378" y="158" style={label}>
          Lakshmi
        </text>
      </motion.g>
      <motion.g initial={false} animate={show(2)} transition={soft}>
        <rect x="176" y="26" width="140" height="44" rx="14" fill="#FFFFFF" />
        <rect x="190" y="39" width="18" height="18" rx="5" fill="none" stroke={C.green} strokeWidth="2.2" />
        <text x="216" y="54" style={{ ...label, textAnchor: "start", fontSize: 14 }}>
          Refill · today
        </text>
      </motion.g>

      {/* Doctor brief */}
      <motion.g initial={false} animate={show(3)} transition={soft}>
        <rect x="344" y="266" width="68" height="84" rx="11" fill="#FFFFFF" />
        <g stroke={C.sand} strokeWidth="5" strokeLinecap="round">
          <path d="M357 286h42M357 300h42M357 314h26" />
        </g>
        <circle cx="402" cy="340" r="15" fill={C.success} />
        <motion.path
          d="M395.5 340.5l4.5 4.5 8-9"
          fill="none"
          stroke={C.cream}
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={false}
          animate={{ pathLength: step >= 3 ? 1 : 0 }}
          transition={{ duration: still ? 0 : 0.6, delay: still ? 0 : 0.35, ease: "easeOut" }}
        />
        <text x="378" y="376" style={label}>
          {steps[3].time}
        </text>
      </motion.g>
    </svg>
  );
}

export type ScrollStoryProps = {
  /** Exactly four steps; the visual is drawn for the default story. */
  steps?: StoryStep[];
  heading?: string;
  /** Where the brand SVGs live. */
  assetBase?: string;
  className?: string;
};

export function ScrollStory({
  steps = DEFAULT_STORY,
  heading = "One missed dose. Zero panic.",
  className = "",
}: ScrollStoryProps) {
  const four = steps.length >= 4 ? steps.slice(0, 4) : DEFAULT_STORY;
  const still = useStill();
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const [step, setStep] = useState(0);

  useMotionValueEvent(scrollYProgress, "change", (p) => {
    const next = Math.max(0, Math.min(3, Math.floor(p * 4)));
    setStep((prev) => (prev === next ? prev : next));
  });

  const line1 = useSpring(useTransform(scrollYProgress, [0.5, 0.68], [0, 1]), { stiffness: 90, damping: 26 });
  const line2 = useSpring(useTransform(scrollYProgress, [0.77, 0.92], [0, 1]), { stiffness: 90, damping: 26 });

  if (still) {
    return (
      <section className={`px-6 py-20 ${className}`} style={{ color: C.ink }} aria-label={heading}>
        <div className="mx-auto grid max-w-6xl items-center gap-10 md:grid-cols-2">
          <div>
            <h2 className="mb-8 text-[2.25rem] font-medium leading-tight md:text-[3.25rem]" style={{ fontFamily: SERIF }}>
              {heading}
            </h2>
            <ol className="space-y-6">
              {four.map((s) => (
                <li key={s.title}>
                  <p className="text-sm font-semibold" style={{ color: C.green }}>
                    {s.time}
                  </p>
                  <p className="text-xl font-semibold">{s.title}</p>
                  <p className="text-lg" style={{ color: C.muted }}>
                    {s.body}
                  </p>
                </li>
              ))}
            </ol>
          </div>
          <Stage step={3} steps={four} line1={1} line2={1} still />
        </div>
      </section>
    );
  }

  return (
    <section ref={ref} className={`relative ${className}`} style={{ height: "380vh", color: C.ink }} aria-label={heading}>
      <div className="sticky top-0 flex h-screen items-center overflow-hidden px-6">
        <div className="mx-auto grid w-full max-w-6xl items-center gap-6 md:grid-cols-2 md:gap-12">
          <div className="order-2 md:order-1">
            <h2 className="mb-6 text-[2rem] font-medium leading-tight md:mb-10 md:text-[3.25rem]" style={{ fontFamily: SERIF }}>
              {heading}
            </h2>
            <div className="flex gap-5">
              {/* progress rail */}
              <div className="relative mt-1 w-1 shrink-0 rounded-full" style={{ background: C.sand }} aria-hidden="true">
                <motion.div className="absolute inset-x-0 top-0 h-full origin-top rounded-full" style={{ background: C.green, scaleY: scrollYProgress }} />
              </div>
              <ol className="relative min-h-[11.5rem] flex-1 md:min-h-[13rem]">
                {four.map((s, i) => (
                  <motion.li
                    key={s.title}
                    className="absolute inset-0"
                    aria-current={i === step ? "step" : undefined}
                    initial={false}
                    animate={{ opacity: i === step ? 1 : 0, y: i === step ? 0 : i < step ? -14 : 14 }}
                    transition={{ duration: 0.7, ease: [0.22, 0.8, 0.26, 1] }}
                  >
                    <p className="mb-2 inline-block rounded-full px-3 py-1 text-sm font-semibold" style={{ background: C.pale, color: C.ink }}>
                      {s.time}
                    </p>
                    <p className="text-2xl font-semibold leading-snug md:text-3xl" style={{ fontFamily: SERIF }}>
                      {s.title}
                    </p>
                    <p className="mt-3 text-lg leading-relaxed md:text-xl" style={{ color: C.muted }}>
                      {s.body}
                    </p>
                  </motion.li>
                ))}
              </ol>
            </div>
          </div>
          <div className="order-1 mx-auto w-full max-w-[26rem] md:order-2 md:max-w-none">
            <Stage step={step} steps={four} line1={line1} line2={line2} still={false} />
          </div>
        </div>
      </div>
    </section>
  );
}

export default ScrollStory;
