import { formatInTimeZone } from "date-fns-tz";

export type SkyPhase = "morning" | "afternoon" | "evening";

/** IST hour → phase: 5–11 morning, 11–17 afternoon, otherwise evening/night. */
export function skyPhase(now: Date): SkyPhase {
  const h = Number(formatInTimeZone(now, "Asia/Kolkata", "H"));
  if (h >= 5 && h < 11) return "morning";
  if (h >= 11 && h < 17) return "afternoon";
  return "evening";
}

export const SKY_BG: Record<SkyPhase, string> = {
  morning: "bg-[linear-gradient(180deg,#F7CDB0_0%,#FADFCB_28%,#FBEEE2_55%,#FBF7F0_85%)]",
  afternoon: "bg-[linear-gradient(180deg,#F3CE85_0%,#F8E0B4_30%,#FBEFD9_58%,#FBF7F0_88%)]",
  evening: "bg-[linear-gradient(180deg,#0F2420_0%,#173A32_30%,#22385A_70%,#2B3A67_100%)]",
};

const STARS = [
  [8, 12, 1.6],
  [18, 30, 1.1],
  [27, 8, 1.3],
  [41, 22, 0.9],
  [55, 10, 1.5],
  [63, 34, 1],
  [72, 16, 1.2],
  [86, 28, 1.4],
  [92, 9, 1],
  [12, 48, 1],
  [48, 44, 0.8],
  [80, 52, 1.1],
] as const;

/** Decorative sky behind the elder view: rising sun, high sun, or moon and stars. */
export function ElderSky({ phase }: { phase: SkyPhase }) {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      {phase === "morning" && (
        <>
          <div className="absolute -right-24 top-40 size-[26rem] rounded-full bg-[radial-gradient(circle,#FFE2B8_0%,#F6B36B_45%,rgb(246_179_107/0)_70%)] opacity-90" />
          <div className="absolute -left-20 top-10 h-24 w-80 rounded-full bg-white/50 blur-2xl" />
        </>
      )}
      {phase === "afternoon" && (
        <>
          <div className="absolute right-[8%] -top-16 size-[22rem] rounded-full bg-[radial-gradient(circle,#FFF4D6_0%,#F7C766_40%,rgb(232_163_61/0)_70%)]" />
          <div className="absolute left-[10%] top-24 h-20 w-72 rounded-full bg-white/45 blur-2xl" />
        </>
      )}
      {phase === "evening" && (
        <>
          {STARS.map(([x, y, r], i) => (
            <span key={i} className="absolute rounded-full bg-[#FFF4D6]" style={{ left: `${x}%`, top: `${y}%`, width: r * 3, height: r * 3, opacity: 0.55 + (i % 3) * 0.15 }} />
          ))}
          <svg viewBox="0 0 120 120" className="absolute right-[7%] top-10 hidden w-36 sm:block">
            <defs>
              <radialGradient id="moon-glow">
                <stop offset="0" stopColor="#FFF4D6" stopOpacity=".45" />
                <stop offset="1" stopColor="#FFF4D6" stopOpacity="0" />
              </radialGradient>
            </defs>
            <circle cx="60" cy="60" r="58" fill="url(#moon-glow)" />
            <path d="M74 30a32 32 0 1 0 18 52 26 26 0 1 1-18-52z" fill="#FBEFD4" />
          </svg>
        </>
      )}
    </div>
  );
}
