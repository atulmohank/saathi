import { googleCalendarUrl } from "@/lib/calendar";

/** "Add to Google Calendar" for an appointment. Opens a prefilled Google Calendar template in a new tab. */
export function CalendarLink({
  title,
  startsAt,
  location,
  details,
  label = "Add to Google Calendar",
  newTabText = "(opens in a new tab)",
  className = "",
}: {
  title: string;
  startsAt: string;
  location?: string;
  details?: string;
  label?: string;
  newTabText?: string;
  className?: string;
}) {
  const href = googleCalendarUrl({ title, start: new Date(startsAt), location: location || undefined, details: details || undefined });
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={`btn-ghost px-0 font-semibold ${className}`}>
      <svg aria-hidden="true" viewBox="0 0 24 24" className="mr-1.5 size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <rect x="3.5" y="5" width="17" height="15" rx="3" />
        <path d="M3.5 10h17M8 3v4M16 3v4M12 13v4M10 15h4" />
      </svg>
      {label}
      <span className="sr-only"> {newTabText}</span>
    </a>
  );
}
