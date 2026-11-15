import type { PersonaCard } from "../TryAs";
import type { StoryStep } from "../motion";
import { IconBell, IconHandHeart, IconLanguages, IconLock } from "./Icons";

/** The five demo personas (fictional people, stand-in photos). */
export const personas: PersonaCard[] = [
  { id: "kamala", name: "Kamala", role: "Elder", band: "bg-accent", blurb: "68 · Independent", detail: "Sees one big card for her next medicine and approves every change herself.", photo: "/images/kamala-arch.webp", alt: "Kamala, a smiling grandmother in a pink sari" },
  { id: "priya", name: "Priya", role: "Family", band: "bg-[#D9875A]", blurb: "Kamala’s daughter", detail: "Watches the week’s pillbox from Pune. Her edits go to Kamala as requests.", photo: "/images/priya-card.webp", alt: "Priya, laughing, in a green sari and glasses" },
  { id: "lakshmi", name: "Nurse Lakshmi", role: "Caretaker", band: "bg-primary", blurb: "On duty", detail: "Marks doses for Joseph and picks up refill tasks.", photo: "/images/lakshmi-card.webp", alt: "Lakshmi in a white coat with a stethoscope" },
  { id: "joseph", name: "Joseph", role: "Elder", band: "bg-accent", blurb: "84 · Supported", detail: "A calm, read-only screen that says who will help with which medicines.", photo: "/images/joseph-card.webp", alt: "Joseph, an older man with an orange scarf, sitting with his grandson" },
  { id: "ravi", name: "Ravi", role: "Decision partner", band: "bg-indigo", blurb: "Joseph’s son", detail: "Approves medicine changes for his father.", photo: "/images/ravi-card.webp", alt: "Ravi, smiling, with a grey beard and a checked scarf" },
];

/** Trust strip cards. */
export const trust = [
  { tone: "bg-[linear-gradient(165deg,#FFF6E6_0%,#FFFDF9_60%)]", Icon: IconLock, title: "A passcode for each person", body: "Everyone signs in with their own passcode. Five wrong tries pause sign-in for 15 minutes." },
  { tone: "bg-[linear-gradient(165deg,#EAF3EE_0%,#FFFDF9_60%)]", Icon: IconBell, title: "An email when a dose is missed", body: "The right person hears at 10, 30, 60 or 120 minutes, depending on the care mode." },
  { tone: "bg-[linear-gradient(165deg,#FBEAE1_0%,#FFFDF9_60%)]", Icon: IconHandHeart, title: "The elder decides", body: "Family changes arrive as requests. A doctor’s instruction applies straight away." },
  { tone: "bg-[linear-gradient(165deg,#ECEFF8_0%,#FFFDF9_60%)]", Icon: IconLanguages, indic: true, title: "Six Indian languages", body: "English, हिन्दी, தமிழ், తెలుగు, ಕನ್ನಡ and മലയാളം, with read-aloud." },
];

/** The three care modes with their escalation ladders (mirrors engine/escalation.ts). */
export const modes = [
  {
    name: "Independent",
    who: "The elder uses a phone and makes the decisions.",
    how: "Family edits arrive as requests that the elder approves.",
    photo: "/images/kamala-avatar.webp",
    alt: "Kamala smiling",
    ladder: [
      ["+30 min", "The elder"],
      ["+60 min", "Caretaker on duty"],
      ["+2 hours", "Family"],
    ],
  },
  {
    name: "Assisted",
    who: "The elder is a little forgetful.",
    how: "Changes apply straight away, and the elder gets a plain-language note.",
    photo: "/images/elders-laughing.webp",
    alt: "Two older women in red saris laughing together",
    ladder: [
      ["+20 min", "Elder and caretaker"],
      ["+60 min", "Family"],
    ],
  },
  {
    name: "Supported",
    who: "The elder lives with dementia or frailty.",
    how: "The caretaker marks doses; a decision partner approves changes.",
    photo: "/images/joseph-avatar.webp",
    alt: "Joseph, an older man in an orange scarf",
    ladder: [
      ["+10 min", "Caretaker on duty"],
      ["+30 min", "Decision partner and family"],
    ],
  },
];

/** Matches the rules engine: "ran out" creates a refill task for whoever is on duty, never an alarm. */
export const story: StoryStep[] = [
  { time: "8:00", title: "Reminder sent", body: "Kamala gets one calm nudge for her morning medicine. Nobody else is disturbed." },
  { time: "8:30", title: "Not taken — Kamala taps “I ran out”", body: "One big button. She says why in a single tap, and Saathi acts on the reason." },
  { time: "8:31", title: "A refill task for Lakshmi. No panic.", body: "Running out is not an emergency, so there is no alarm ladder — just a refill task for the caretaker on duty." },
  { time: "Thursday", title: "Doctor brief ready", body: "The skipped dose and its reason are already in the brief for Thursday’s visit." },
];

/** Unsplash photographers [name, username]. */
export const credits = [
  ["Richard Saunders", "rdsaunders"],
  ["Pranav Rasal", "mrpranav87"],
  ["Ashwini Chaudhary (Monty)", "suicide_chewbacca"],
  ["Fotos", "fotospk"],
  ["Wilfred Sequeira", "wilfredsequeira"],
  ["Trương Tuyết Ly", "liliantruong2603"],
  ["Frederick Shaw", "dropfastcollective"],
  ["Miles Burke", "milesb"],
  ["National Cancer Institute", "nci"],
  ["WorldSikhOrg", "worldsikhorg"],
];
