"use client";

/**
 * <HeroScene /> — Saathi hero illustration, alive.
 * Layers (same ids as /public/brand/illustrations/hero.svg):
 *   #hero-background · #hero-family-circle · #hero-grandmother · #hero-pillbox · #hero-floating
 * Motion: pointer parallax per layer, the care circle orbits very slowly (figures stay upright),
 * pills drop into the organiser one by one, small icons drift.
 * prefers-reduced-motion → the static final illustration, nothing moves.
 * Only dependency: framer-motion.
 */
import { useEffect, useRef, type PointerEvent, type ReactNode } from "react";
import {
  animate,
  motion,
  useInView,
  useMotionValue,

  useSpring,
  useTransform,
  type MotionValue,
} from "framer-motion";
import { useStill } from "./useStill";

const ORBIT = { cx: 400, cy: 292, r: 236 } as const;

type OrbitItem = { id: string; offset: number; art: ReactNode };
type PlacedItem = { id?: string; x: number; y: number; art: ReactNode };

const BACKGROUND: ReactNode = (<><circle cx="400" cy="296" r="262" fill="#F7EFE1"/><path d="M262 520V262a138 138 0 0 1 276 0v258z" fill="#F3E9D8"/><circle cx="400" cy="196" r="46" fill="#F6DDB0" fillOpacity=".8"/><ellipse cx="400" cy="536" rx="330" ry="22" fill="#EFE4D0"/><g><path d="M76 440c-22-26-18-58 2-78 12 26 12 52-2 78z" fill="#2E7D4F"/><path d="M84 446c-4-36 12-64 40-74 2 32-12 58-40 74z" fill="#1F5C4A"/><path d="M70 450c-26-8-42-30-42-56 26 6 42 26 42 56z" fill="#5E9B7C"/><path d="M50 446h56l-7 70H57z" fill="#C96F4A"/><rect x="45" y="438" width="66" height="14" rx="7" fill="#B55F3D"/></g><g><rect x="676" y="462" width="96" height="10" rx="5" fill="#8A5A3C"/><path d="M718 472h12v60h-12z" fill="#8A5A3C"/><rect x="700" y="526" width="48" height="8" rx="4" fill="#8A5A3C"/><circle cx="724" cy="424" r="30" fill="#F6DDB0" fillOpacity=".55"/><g transform="translate(724 445)"><g transform="scale(0.9)"><path d="M-22 0c2 11 10 17 22 17s20-6 22-17c-7 3-14 4.5-22 4.5S-15 3-22 0z" fill="#C96F4A"/><path d="M0-25c4.5 5 7 8.7 7 12.5a7 7 0 0 1-14 0C-7-16.3-4.5-20 0-25z" fill="#E8A33D"/></g></g></g></>);

const GRANDMOTHER: ReactNode = (<><rect x="300" y="262" width="200" height="240" rx="64" fill="#1F5C4A"/><rect x="318" y="280" width="164" height="204" rx="50" fill="#2A6F5A"/><rect x="312" y="496" width="13" height="22" rx="5" fill="#8A5A3C"/><rect x="475" y="496" width="13" height="22" rx="5" fill="#8A5A3C"/><circle cx="425" cy="313" r="13.5" fill="#E4E0D6"/><path d="M338 504c-6-62 8-118 62-124 54 6 68 62 62 124z" fill="#C96F4A"/><path d="M350 424c20-26 52-38 88-32l-52 112h-46c-4-30-1-58 10-80z" fill="#E8A33D"/><path d="M438 392l-52 112" stroke="#FBF7F0" strokeOpacity=".75" strokeWidth="3" strokeLinecap="round"/><rect x="280" y="404" width="52" height="104" rx="26" fill="#174C3D"/><rect x="468" y="404" width="52" height="104" rx="26" fill="#174C3D"/><rect x="391" y="352" width="18" height="34" rx="9" fill="#B57B55"/><circle cx="400" cy="338" r="30" fill="#C68B62"/><path d="M370 338a30 30 0 0 1 60 0c-6-12-17-18-30-18s-24 6-30 18z" fill="#E4E0D6"/><circle cx="400" cy="331" r="2.7" fill="#B3261E"/><circle cx="370.5" cy="346" r="2.6" fill="#E8A33D"/><circle cx="429.5" cy="346" r="2.6" fill="#E8A33D"/><path d="M358 420c-12 44 20 52 50 40" fill="none" stroke="#C68B62" strokeWidth="15" strokeLinecap="round"/><path d="M446 418c16 30 8 46-12 44" fill="none" stroke="#C68B62" strokeWidth="15" strokeLinecap="round"/><path d="M359 412l-4 22M445 410l7 20" stroke="#8E4A32" strokeWidth="18" strokeLinecap="round"/><g transform="rotate(-9 421 440)"><rect x="402" y="406" width="38" height="66" rx="8" fill="#1F2A24"/><rect x="406" y="411" width="30" height="56" rx="4.5" fill="#FBF7F0"/><circle cx="421" cy="433" r="9.5" fill="#2E7D4F"/><path d="M416.5 433.2l3.3 3.3 5.8-6.4" fill="none" stroke="#FBF7F0" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/><rect x="411" y="450" width="20" height="4.5" rx="2.250" fill="#E8A33D"/><rect x="414" y="458" width="14" height="3.5" rx="1.750" fill="#E4E0D6"/></g><circle cx="409" cy="462" r="8.5" fill="#C68B62"/><circle cx="433" cy="463" r="8.5" fill="#C68B62"/></>);

const PILLBOX: ReactNode = (<><ellipse cx="400" cy="574" rx="176" ry="9" fill="#1F2A24" fillOpacity=".08"/><rect x="238" y="499" width="314" height="64" rx="16" fill="#FFFFFF"/><rect x="247" y="508" width="38" height="46" rx="9" fill="#F3E9D8"/><rect x="290" y="508" width="38" height="46" rx="9" fill="#F3E9D8"/><rect x="333" y="508" width="38" height="46" rx="9" fill="#F3E9D8"/><rect x="376" y="508" width="38" height="46" rx="9" fill="#F3E9D8"/><rect x="419" y="508" width="38" height="46" rx="9" fill="#F3E9D8"/><rect x="462" y="508" width="38" height="46" rx="9" fill="#F3E9D8"/><rect x="505" y="508" width="38" height="46" rx="9" fill="#F3E9D8"/><circle cx="266.0" cy="493" r="3.2" fill="#E8A33D"/><circle cx="309.0" cy="493" r="3.2" fill="#E8A33D"/><circle cx="352.0" cy="493" r="3.2" fill="#E8A33D"/><circle cx="395.0" cy="493" r="3.2" fill="#E8A33D"/><circle cx="438.0" cy="493" r="3.2" fill="#E8A33D"/><circle cx="481.0" cy="493" r="2.2" fill="#1F5C4A"/><circle cx="524.0" cy="493" r="2.2" fill="#1F5C4A"/></>);

const FAMILY: OrbitItem[] = [
  { id: "family-priya", offset: 214, art: (<><g transform="translate(-37 -37) scale(.771)"><circle cx="48" cy="48" r="52" fill="#FBF7F0"/><clipPath id="sa-clip-priya"><circle cx="48" cy="48" r="48"/></clipPath><circle cx="48" cy="48" r="48" fill="#CFE3D6"/><g clipPath="url(#sa-clip-priya)"><path d="M29 44c0-13 8-21.5 19-21.5S67 31 67 44v30H29z" fill="#1F2A24"/><path d="M10 96c0-16 15-26 38-26s38 10 38 26z" fill="#E8A33D"/><path d="M41 70.3l7 9 7-9z" fill="#C98F68"/><rect x="42" y="52" width="12" height="20" rx="6" fill="#B8805B"/><circle cx="48" cy="42" r="16" fill="#C98F68"/><path d="M32 42c0-10 7-17 16-17s16 7 16 17c-3-5-7-8-12-9-5 4-13 5-20 9z" fill="#1F2A24"/><circle cx="48" cy="39" r="1.3" fill="#B3261E"/></g></g></>) },
  { id: "family-lakshmi", offset: 326, art: (<><g transform="translate(-37 -37) scale(.771)"><circle cx="48" cy="48" r="52" fill="#FBF7F0"/><clipPath id="sa-clip-lakshmi"><circle cx="48" cy="48" r="48"/></clipPath><circle cx="48" cy="48" r="48" fill="#F7E4D8"/><g clipPath="url(#sa-clip-lakshmi)"><circle cx="48" cy="22" r="8" fill="#1F2A24"/><path d="M10 96c0-16 15-26 38-26s38 10 38 26z" fill="#FFFFFF"/><path d="M40 70.5l8 10 8-10 5 1.5-13 15-13-15z" fill="#CFE3D6"/><rect x="42" y="52" width="12" height="21" rx="6" fill="#A66E49"/><circle cx="48" cy="42" r="16" fill="#B57A52"/><path d="M32 42c0-10 7-17 16-17s16 7 16 17c-4-6-9-9-16-9s-12 3-16 9z" fill="#1F2A24"/><path d="M36 73c0 13 24 13 24 0" fill="none" stroke="#1F5C4A" strokeWidth="2.6" strokeLinecap="round"/><circle cx="62" cy="86" r="4.2" fill="#1F5C4A"/><circle cx="62" cy="86" r="1.6" fill="#CFE3D6"/><path d="M60 76v6" stroke="#1F5C4A" strokeWidth="2.6" strokeLinecap="round"/><path d="M28 82h8M32 78v8" stroke="#2E7D4F" strokeWidth="2.6" strokeLinecap="round"/></g></g></>) },
  { id: "family-ravi", offset: 38, art: (<><g transform="translate(-37 -37) scale(.771)"><circle cx="48" cy="48" r="52" fill="#FBF7F0"/><clipPath id="sa-clip-ravi"><circle cx="48" cy="48" r="48"/></clipPath><circle cx="48" cy="48" r="48" fill="#EBD9C4"/><g clipPath="url(#sa-clip-ravi)"><path d="M10 96c0-16 15-26 38-26s38 10 38 26z" fill="#1F5C4A"/><path d="M40 70.3l8 9 8-9z" fill="#A9714B"/><path d="M37 70l11 9-6 7zM59 70l-11 9 6 7z" fill="#2E7D4F"/><rect x="42" y="52" width="12" height="20" rx="6" fill="#98643F"/><circle cx="48" cy="42" r="16" fill="#A9714B"/><path d="M31.5 41c0-10.5 7-17.5 16.5-17.5S64.5 30.5 64.5 41c-2.5-4-5-6.5-8.5-7.5-6 2.5-13 2.5-18.5-.5-3 2-5 4.5-6 8z" fill="#1F2A24"/></g></g></>) },
  { id: "family-doctor", offset: 146, art: (<><g transform="translate(-37 -37) scale(.771)"><circle cx="48" cy="48" r="52" fill="#FBF7F0"/><clipPath id="sa-clip-doctor"><circle cx="48" cy="48" r="48"/></clipPath><circle cx="48" cy="48" r="48" fill="#E6ECE2"/><g clipPath="url(#sa-clip-doctor)"><path d="M10 96c0-16 15-26 38-26s38 10 38 26z" fill="#FFFFFF"/><path d="M40 70.3l8 12 8-12z" fill="#CFE3D6"/><rect x="42" y="52" width="12" height="20" rx="6" fill="#A9754F"/><circle cx="48" cy="42" r="16" fill="#BC855D"/><path d="M31.5 43c-1-11 6-19.5 16.5-19.5S65.5 32 64.5 43c-2-6-6-9.5-11-10.5-6 .5-11 0-15-2-3 2.5-5.5 7-7 12.5z" fill="#3A322B"/><path d="M37 72c-1 14 22 14 22 0" fill="none" stroke="#1F2A24" strokeWidth="2.4" strokeLinecap="round"/><circle cx="59" cy="86" r="3.8" fill="#E8A33D"/></g></g></>) }
];

const PILLS: PlacedItem[] = [
  { x: 266.0, y: 533, art: (<><g transform="rotate(-28)"><rect x="-12" y="-5.5" width="24" height="11" rx="5.5" fill="#E8A33D"/><path d="M0-5.5h6.5a5.5 5.5 0 0 1 0 11H0z" fill="#1F5C4A"/></g></>) },
  { x: 309.0, y: 533, art: (<><circle r="8.5" fill="#C96F4A"/><path d="M-5 0h10" stroke="#FBF7F0" strokeOpacity=".8" strokeWidth="2" strokeLinecap="round"/></>) },
  { x: 352.0, y: 533, art: (<><g transform="rotate(24)"><rect x="-12" y="-5.5" width="24" height="11" rx="5.5" fill="#2E7D4F"/><path d="M0-5.5h6.5a5.5 5.5 0 0 1 0 11H0z" fill="#CFE3D6"/></g></>) },
  { x: 395.0, y: 533, art: (<><circle r="8.5" fill="#E8A33D"/><path d="M-5 0h10" stroke="#FBF7F0" strokeOpacity=".8" strokeWidth="2" strokeLinecap="round"/></>) },
  { x: 438.0, y: 533, art: (<><g transform="rotate(-28)"><rect x="-12" y="-5.5" width="24" height="11" rx="5.5" fill="#E8A33D"/><path d="M0-5.5h6.5a5.5 5.5 0 0 1 0 11H0z" fill="#1F5C4A"/></g></>) },
  { x: 481.0, y: 533, art: (<><circle r="8.5" fill="#C96F4A"/><path d="M-5 0h10" stroke="#FBF7F0" strokeOpacity=".8" strokeWidth="2" strokeLinecap="round"/></>) },
  { x: 524.0, y: 533, art: (<><g transform="rotate(24)"><rect x="-12" y="-5.5" width="24" height="11" rx="5.5" fill="#2E7D4F"/><path d="M0-5.5h6.5a5.5 5.5 0 0 1 0 11H0z" fill="#CFE3D6"/></g></>) }
];

const FLOATING: PlacedItem[] = [
  { id: "float-capsule", x: 96, y: 128, art: (<><g transform="rotate(-32)"><rect x="-27" y="-11.5" width="54" height="23" rx="11.5" fill="#E8A33D"/><path d="M0-11.5h15.5a11.5 11.5 0 0 1 0 23H0z" fill="#1F5C4A"/><path d="M-19-5h12" stroke="#FFFFFF" strokeOpacity=".55" strokeWidth="3" strokeLinecap="round"/></g></>) },
  { id: "float-heart", x: 708, y: 150, art: (<><circle r="26" fill="#FFFFFF"/><path d="M0 12C-20-2-13-15-6-15-2.5-15 0-12.5 0-10c0-2.5 2.5-5 6-5 7 0 14 13-6 27z" fill="#C96F4A"/></>) },
  { id: "float-bell", x: 742, y: 318, art: (<><circle r="26" fill="#FFFFFF"/><path d="M0-13a9 9 0 0 1 9 9v6l3.5 5.5h-25L-9 2v-6a9 9 0 0 1 9-9z" fill="#E8A33D"/><circle cy="11.5" r="3" fill="#E8A33D"/></>) },
  { id: "float-check", x: 70, y: 300, art: (<><circle r="22" fill="#2E7D4F"/><path d="M-9.5 .5l6.5 6.5L9.5-6.5" fill="none" stroke="#FBF7F0" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round"/></>) },
  { id: "float-calendar", x: 618, y: 58, art: (<><rect x="-23" y="-21" width="46" height="44" rx="9" fill="#FFFFFF"/><path d="M-23-12a9 9 0 0 1 9-9h28a9 9 0 0 1 9 9v3h-46z" fill="#1F5C4A"/><path d="M-11-25v8M11-25v8" stroke="#1F2A24" strokeWidth="3" strokeLinecap="round"/><g fill="#E4E0D6"><circle cx="-12" cy="1" r="2.6"/><circle cy="1" r="2.6"/><circle cx="12" cy="1" r="2.6"/><circle cx="-12" cy="12" r="2.6"/><circle cx="12" cy="12" r="2.6"/></g><circle cy="12" r="4.6" fill="#E8A33D"/></>) },
  { id: "float-tablet", x: 196, y: 52, art: (<><circle r="13" fill="#F6DDB0"/><path d="M-8.5 0h17" stroke="#E8A33D" strokeWidth="2.4" strokeLinecap="round"/></>) },
  { id: "float-sparkle-a", x: 306, y: 30, art: (<><path d="M0-11C1-3 3-1 11 0 3 1 1 3 0 11-1 3-3 1-11 0-3-1-1-3 0-11z" fill="#E8A33D"/></>) },
  { id: "float-sparkle-b", x: 662, y: 236, art: (<><path d="M0-7C.7-2 2-.7 7 0 2 .7 .7 2 0 7-.7 2-2 .7-7 0-2-.7-.7-2 0-7z" fill="#1F5C4A" fillOpacity=".55"/></>) },
  { id: "float-sparkle-c", x: 140, y: 222, art: (<><path d="M0-7C.7-2 2-.7 7 0 2 .7 .7 2 0 7-.7 2-2 .7-7 0-2-.7-.7-2 0-7z" fill="#1F5C4A" fillOpacity=".55"/></>) },
  { id: "float-leaf", x: 474, y: 24, art: (<><path d="M-14 10C-14-6-2-14 14-12 14 4 4 13-14 10z" fill="#5E9B7C"/><path d="M-12 9L8-7" stroke="#FBF7F0" strokeOpacity=".7" strokeWidth="1.8" strokeLinecap="round"/></>) }
];

function Layer({
  id,
  px,
  py,
  depth,
  children,
}: {
  id: string;
  px: MotionValue<number>;
  py: MotionValue<number>;
  depth: number;
  children: ReactNode;
}) {
  const x = useTransform(px, (v) => v * depth);
  const y = useTransform(py, (v) => v * depth);
  return (
    <motion.g id={id} style={{ x, y }}>
      {children}
    </motion.g>
  );
}

function OrbitFigure({ angle, item }: { angle: MotionValue<number>; item: OrbitItem }) {
  const x = useTransform(angle, (a) => ORBIT.cx + ORBIT.r * Math.cos(((a + item.offset) * Math.PI) / 180));
  const y = useTransform(angle, (a) => ORBIT.cy + ORBIT.r * Math.sin(((a + item.offset) * Math.PI) / 180));
  return (
    <motion.g id={item.id} style={{ x, y }}>
      {item.art}
    </motion.g>
  );
}

export type HeroSceneProps = {
  className?: string;
  /** Seconds for one full turn of the care circle. Slow on purpose. */
  orbitSeconds?: number;
  /** Max parallax travel in SVG units for the front-most layer. */
  parallax?: number;
  /** Set true if the text next to the hero already says everything. */
  decorative?: boolean;
};

export function HeroScene({ className, orbitSeconds = 150, parallax = 22, decorative = false }: HeroSceneProps) {
  const still = useStill();
  const wrap = useRef<HTMLDivElement>(null);
  const inView = useInView(wrap, { once: true, amount: 0.35 });

  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const px = useSpring(mx, { stiffness: 38, damping: 18, mass: 1.2 });
  const py = useSpring(my, { stiffness: 38, damping: 18, mass: 1.2 });

  const angle = useMotionValue(0);
  useEffect(() => {
    if (still) return;
    const controls = animate(angle, 360, { duration: orbitSeconds, ease: "linear", repeat: Infinity });
    return () => controls.stop();
  }, [angle, orbitSeconds, still]);

  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    if (still || e.pointerType === "touch") return;
    const r = e.currentTarget.getBoundingClientRect();
    mx.set(((e.clientX - r.left) / r.width - 0.5) * 2);
    my.set(((e.clientY - r.top) / r.height - 0.5) * 2);
  };
  const onLeave = () => {
    mx.set(0);
    my.set(0);
  };

  const d = (k: number) => (still ? 0 : -parallax * k);

  return (
    <div ref={wrap} className={className} onPointerMove={onMove} onPointerLeave={onLeave}>
      <svg
        viewBox="0 0 800 600"
        width="100%"
        style={{ display: "block", height: "auto", overflow: "visible" }}
        {...(decorative
          ? { "aria-hidden": true }
          : { role: "img", "aria-labelledby": "saathi-hero-title saathi-hero-desc" })}
      >
        {!decorative && (
          <>
            <title id="saathi-hero-title">A grandmother at home with her phone, surrounded by her care circle</title>
            <desc id="saathi-hero-desc">
              An elderly woman in a sari sits in an armchair holding a phone. Her daughter, son, nurse and doctor form
              a circle around her, and a seven-day pill organiser sits in front.
            </desc>
          </>
        )}

        <Layer id="hero-background" px={px} py={py} depth={d(0.18)}>
          {BACKGROUND}
        </Layer>

        <Layer id="hero-family-circle" px={px} py={py} depth={d(0.4)}>
          <circle cx="400" cy="292" r="236" fill="none" stroke="#1F5C4A" strokeOpacity=".28" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="1 11"/>
          {FAMILY.map((item) => (
            <OrbitFigure key={item.id} angle={angle} item={item} />
          ))}
        </Layer>

        <Layer id="hero-grandmother" px={px} py={py} depth={d(0.6)}>
          <motion.g
            animate={still ? undefined : { y: [0, -3, 0] }}
            transition={{ duration: 9, ease: "easeInOut", repeat: Infinity }}
          >
            {GRANDMOTHER}
          </motion.g>
        </Layer>

        <Layer id="hero-pillbox" px={px} py={py} depth={d(0.8)}>
          {PILLBOX}
          {PILLS.map((p, i) => {
            const delay = 0.7 + i * 0.5;
            return (
              <g key={i} id={`pill-${i + 1}`} transform={`translate(${p.x} ${p.y})`}>
                <motion.g
                  initial={still ? false : { y: -110, opacity: 0 }}
                  animate={still || inView ? { y: 0, opacity: 1 } : { y: -110, opacity: 0 }}
                  transition={{
                    y: { type: "spring", stiffness: 70, damping: 13, delay },
                    opacity: { duration: 0.5, ease: "easeOut", delay },
                  }}
                >
                  {p.art}
                </motion.g>
              </g>
            );
          })}
        </Layer>

        <Layer id="hero-floating" px={px} py={py} depth={d(1)}>
          {FLOATING.map((f, i) => (
            <g key={f.id} id={f.id} transform={`translate(${f.x} ${f.y})`}>
              <motion.g
                animate={still ? undefined : { y: [0, i % 2 ? 8 : -9, 0], rotate: [0, i % 2 ? -2.5 : 2.5, 0] }}
                transition={{ duration: 7 + (i % 4) * 1.4, ease: "easeInOut", repeat: Infinity, delay: i * 0.45 }}
              >
                {f.art}
              </motion.g>
            </g>
          ))}
        </Layer>
      </svg>
    </div>
  );
}

export default HeroScene;
