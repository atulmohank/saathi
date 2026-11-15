/**
 * Builds a Google Calendar "add event" template link. No API key and no OAuth: the
 * link just opens Google Calendar prefilled, and the person chooses to save it.
 */
export interface CalendarEvent {
  title: string;
  /** Event start (any instant; encoded as UTC). */
  start: Date;
  durationMinutes?: number;
  location?: string;
  details?: string;
}

/** `20261117T074700Z` — the compact UTC format Google Calendar's template URL expects. */
export function toCalendarStamp(d: Date): string {
  return d
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");
}

/** Returns a fully URL-encoded https://calendar.google.com/calendar/render?action=TEMPLATE… link. */
export function googleCalendarUrl(e: CalendarEvent): string {
  const end = new Date(e.start.getTime() + (e.durationMinutes ?? 60) * 60_000);
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: e.title,
    dates: `${toCalendarStamp(e.start)}/${toCalendarStamp(end)}`,
    ctz: "Asia/Kolkata",
  });
  if (e.location) params.set("location", e.location);
  if (e.details) params.set("details", e.details);
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
