import type { ChangeSource, Mode, Role } from "./types";

export type ChangeFlow = "apply_now" | "needs_elder_approval" | "needs_decision_partner";

/** Decides whether a medicine change applies now or needs the elder's or the decision partner's approval. A doctor's instruction always applies. */
export function resolveChangeFlow(input: {
  mode: Mode;
  source: ChangeSource;
  actorRole: Role;
}): ChangeFlow {
  // A doctor's instruction is never blocked; she is notified and it is logged.
  if (input.source === "doctor_instruction") return "apply_now";

  switch (input.mode) {
    case "independent":
      return input.actorRole === "elder" ? "apply_now" : "needs_elder_approval";
    case "assisted":
      // Applied immediately; she gets a plain-language "What changed" card.
      return "apply_now";
    case "supported":
      return input.actorRole === "decision_partner" ? "apply_now" : "needs_decision_partner";
  }
}
