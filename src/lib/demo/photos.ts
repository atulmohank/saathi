/** Stand-in photographs for the fictional demo circle only (Unsplash, credited in README + footer). */
const DEMO_PHOTOS: Record<string, string> = {
  Kamala: "/images/kamala-avatar.webp",
  Joseph: "/images/joseph-avatar.webp",
  Priya: "/images/priya-avatar.webp",
  "Nurse Lakshmi": "/images/lakshmi-avatar.webp",
  Ravi: "/images/ravi-avatar.webp",
};

export function demoPhoto(displayName: string): string | null {
  return DEMO_PHOTOS[displayName] ?? null;
}
