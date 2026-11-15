/**
 * The saffron "thread" — Saathi's signature doodle (like the kalava thread tied at home).
 * Purely decorative: aria-hidden, under content, never on text.
 */
const PATHS = {
  // a loose loop that drifts across a section
  loop: "M-20 140C120 60 260 40 330 120c60 70-30 150-90 100-70-58 40-170 180-150 150 22 210 160 360 130 110-22 170-110 260-150",
  // a long gentle wave with one curl, for joining two sections
  wave: "M-10 80c160-70 300 60 460 20 90-22 120-90 70-110-60-24-110 60-40 110 90 64 260-30 420-10 140 18 230 90 360 60",
  // a small curl to underline or circle a word
  curl: "M4 40C40 8 120 6 168 22c30 10 28 34 4 38-30 6-44-26-12-36 40-12 90 6 120 20",
} as const;

export function Thread({
  variant = "loop",
  className = "",
  width = 1200,
  height = 260,
  color = "var(--accent)",
  strokeWidth = 2.5,
}: {
  variant?: keyof typeof PATHS;
  className?: string;
  width?: number;
  height?: number;
  color?: string;
  strokeWidth?: number;
}) {
  return (
    <svg aria-hidden="true" focusable="false" viewBox={`0 0 ${width} ${height}`} className={`pointer-events-none ${className}`} preserveAspectRatio="none">
      <path
        d={PATHS[variant]}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
