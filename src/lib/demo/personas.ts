/** Fictional demo people. All demo emails go to DEMO_EMAIL_SINK, never to these addresses. */
export const DEMO_PERSONAS = {
  kamala: { displayName: "Kamala", role: "elder", blurb: "Grandma, 68 · Independent" },
  priya: { displayName: "Priya", role: "family", blurb: "Kamala's daughter" },
  lakshmi: { displayName: "Nurse Lakshmi", role: "caretaker", blurb: "Caretaker on duty" },
  joseph: { displayName: "Joseph", role: "elder", blurb: "84 · Supported" },
  ravi: { displayName: "Ravi", role: "decision_partner", blurb: "Joseph's son · Decision Partner" },
} as const;
export type Persona = keyof typeof DEMO_PERSONAS;
