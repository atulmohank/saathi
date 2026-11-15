const COLOURS: Record<string, string> = {
  white: "#FFFFFF",
  pink: "#F2A7B8",
  yellow: "#F5D35B",
  orange: "#F0A050",
  red: "#D9534F",
  blue: "#7FA7D9",
  green: "#7DBE8E",
  brown: "#A0785A",
  purple: "#B9A3D0",
};

/** Decorative pill drawn from the medicine's "pill look" (e.g. "pink round", "white oval"). */
export function Pill({ look, size = 40 }: { look: string; size?: number }) {
  const words = look.toLowerCase().split(/\s+/);
  const fill = COLOURS[words.find((w) => w in COLOURS) ?? "white"];
  const round = words.includes("round");
  const capsule = words.includes("capsule");
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true" className="shrink-0">
      {round ? (
        <circle cx="20" cy="20" r="14" fill={fill} stroke="#1F2A24" strokeWidth="1.5" />
      ) : capsule ? (
        <g stroke="#1F2A24" strokeWidth="1.5">
          <path d="M8 20a8 8 0 0 1 8-8h4v16h-4a8 8 0 0 1-8-8z" fill={fill} />
          <path d="M20 12h4a8 8 0 0 1 0 16h-4z" fill="#FFFFFF" />
        </g>
      ) : (
        <ellipse cx="20" cy="20" rx="16" ry="10" fill={fill} stroke="#1F2A24" strokeWidth="1.5" />
      )}
      {round && <line x1="10" y1="20" x2="30" y2="20" stroke="#1F2A24" strokeWidth="1" opacity="0.4" />}
    </svg>
  );
}
