"use client";

/**
 * <PillboxFill /> — one pill-organiser compartment.
 * taken   → fill rises with a soft spring, then the check mark draws itself
 * skipped → amber + dash (her choice, shown calmly)   missed → red outline + dot   upcoming → empty outline
 * Status is never colour-only: every state has its own glyph and an aria-label.
 * prefers-reduced-motion → jumps straight to the final state.
 * Only dependency: framer-motion.
 */
import { useId } from "react";
import { motion } from "framer-motion";
import { useStill } from "./useStill";

export type DoseStatus = "upcoming" | "taken" | "skipped" | "missed";

export type PillboxFillProps = {
  status: DoseStatus;
  /** Full description for screen readers, e.g. "Monday morning, Metformin — taken at 8:02". */
  label: string;
  /** Rendered size in px (min 48 keeps it an elder-friendly touch target). */
  size?: number;
  /** If given, the compartment is a button. */
  onPress?: () => void;
  disabled?: boolean;
  className?: string;
};

const TONE: Record<DoseStatus, { fill: string; stroke: string }> = {
  upcoming: { fill: "#FBF7F0", stroke: "#C9CFC4" },
  taken: { fill: "#2E7D4F", stroke: "#2E7D4F" },
  skipped: { fill: "#F6DDB0", stroke: "#E8A33D" },
  missed: { fill: "#FBF7F0", stroke: "#B3261E" },
};

export function PillboxFill({ status, label, size = 64, onPress, disabled, className }: PillboxFillProps) {
  const still = useStill();
  const clipId = `sa-cell-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const px = Math.max(48, size);
  const taken = status === "taken";
  const tone = TONE[status];

  const art = (
    <svg viewBox="0 0 64 64" width={px} height={px} aria-hidden="true" style={{ display: "block" }}>
      <defs>
        <clipPath id={clipId}>
          <rect x="4" y="4" width="56" height="56" rx="15" />
        </clipPath>
      </defs>
      <motion.rect
        x="4"
        y="4"
        width="56"
        height="56"
        rx="15"
        initial={false}
        animate={{ fill: taken ? TONE.upcoming.fill : tone.fill, stroke: tone.stroke }}
        transition={{ duration: still ? 0 : 0.5 }}
        strokeWidth={status === "missed" ? 3 : 2.5}
      />
      {/* the fill that rises from the bottom */}
      <g clipPath={`url(#${clipId})`}>
        <motion.rect
          x="4"
          y="4"
          width="56"
          height="56"
          fill={TONE.taken.fill}
          style={{ originY: 1 }}
          initial={false}
          animate={{ scaleY: taken ? 1 : 0 }}
          transition={still ? { duration: 0 } : { type: "spring", stiffness: 110, damping: 15, mass: 0.9 }}
        />
      </g>
      {/* check mark draws after the fill settles */}
      <motion.path
        d="M20 33.5l8.5 8.5L45 24"
        fill="none"
        stroke="#FBF7F0"
        strokeWidth="5.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={false}
        animate={{ pathLength: taken ? 1 : 0, opacity: taken ? 1 : 0 }}
        transition={
          still
            ? { duration: 0 }
            : { pathLength: { duration: 0.55, ease: "easeOut", delay: taken ? 0.28 : 0 }, opacity: { duration: 0.15, delay: taken ? 0.28 : 0 } }
        }
      />
      {status === "skipped" && <path d="M22 32h20" stroke="#8A5A12" strokeWidth="5" strokeLinecap="round" />}
      {status === "missed" && <circle cx="32" cy="32" r="5.5" fill="#B3261E" />}
      {status === "upcoming" && <circle cx="32" cy="32" r="3" fill="#C9CFC4" />}
    </svg>
  );

  if (onPress) {
    return (
      <button
        type="button"
        onClick={onPress}
        disabled={disabled}
        aria-label={label}
        aria-pressed={taken}
        className={className}
        style={{ padding: 0, border: 0, background: "none", borderRadius: 16, cursor: disabled ? "default" : "pointer", lineHeight: 0 }}
      >
        {art}
      </button>
    );
  }
  return (
    <span role="img" aria-label={label} className={className} style={{ display: "inline-block", lineHeight: 0 }}>
      {art}
    </span>
  );
}

export default PillboxFill;
