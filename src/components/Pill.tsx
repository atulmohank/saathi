import { useId } from "react";

/** [face, edge] colours per pill colour word. Edge is the shaded rim that gives the pill volume. */
const COLOURS: Record<string, [string, string]> = {
  white: ["#FFFFFF", "#CFC8BC"],
  pink: ["#F6B8C6", "#D9798F"],
  yellow: ["#F8DC6E", "#D7A92A"],
  orange: ["#F5AE5E", "#D07A26"],
  red: ["#E2706B", "#A93A35"],
  blue: ["#9BBBE3", "#5C82B8"],
  green: ["#93CCA0", "#4E9563"],
  brown: ["#B88E6E", "#7D5A40"],
  purple: ["#C8B6DC", "#8F78AE"],
};

/**
 * Pill drawn in its real colour from the medicine's "pill look" (e.g. "pink round", "white oval"),
 * with a shaded rim, a soft highlight and a contact shadow so even a white tablet reads on cream.
 */
export function Pill({ look, size = 40 }: { look: string; size?: number }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const words = look.toLowerCase().split(/\s+/);
  const [face, edge] = COLOURS[words.find((w) => w in COLOURS) ?? "white"];
  const round = words.includes("round");
  const capsule = words.includes("capsule");
  const g = `pill-${uid}`;
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true" className="shrink-0">
      <defs>
        <radialGradient id={`${g}-f`} cx="38%" cy="32%" r="75%">
          <stop offset="0" stopColor="#fff" stopOpacity=".9" />
          <stop offset=".35" stopColor={face} />
          <stop offset="1" stopColor={edge} />
        </radialGradient>
        <radialGradient id={`${g}-w`} cx="38%" cy="32%" r="75%">
          <stop offset="0" stopColor="#fff" />
          <stop offset=".45" stopColor="#FBF7F0" />
          <stop offset="1" stopColor="#D8D1C6" />
        </radialGradient>
      </defs>
      <ellipse cx="20" cy="34.5" rx="13" ry="2.2" fill="#1F2A24" opacity=".12" />
      {round ? (
        <>
          <circle cx="20" cy="19" r="13.5" fill={`url(#${g}-f)`} stroke={edge} strokeWidth="1" />
          <path d="M9 19h22" stroke={edge} strokeWidth="1.2" strokeLinecap="round" opacity=".55" />
        </>
      ) : capsule ? (
        <g transform="rotate(-28 20 19)">
          <path d="M6 19a7.5 7.5 0 0 1 7.5-7.5H20v15h-6.5A7.5 7.5 0 0 1 6 19z" fill={`url(#${g}-f)`} stroke={edge} strokeWidth="1" />
          <path d="M20 11.5h6.5a7.5 7.5 0 0 1 0 15H20z" fill={`url(#${g}-w)`} stroke="#CFC8BC" strokeWidth="1" />
        </g>
      ) : (
        <>
          <ellipse cx="20" cy="19" rx="16" ry="10" fill={`url(#${g}-f)`} stroke={edge} strokeWidth="1" />
          <path d="M12 19h16" stroke={edge} strokeWidth="1.1" strokeLinecap="round" opacity=".5" />
        </>
      )}
      <ellipse cx="15" cy="14" rx="4.5" ry="2" fill="#fff" opacity=".7" transform="rotate(-20 15 14)" />
    </svg>
  );
}
