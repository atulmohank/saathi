import { describe, expect, it } from "vitest";
import { googleCalendarUrl, toCalendarStamp } from "../calendar";

describe("toCalendarStamp", () => {
  it.each([
    ["2026-11-17T07:47:00.000Z", "20261117T074700Z"],
    ["2026-01-01T00:00:00.000Z", "20260101T000000Z"],
  ])("%s → %s", (iso, stamp) => {
    expect(toCalendarStamp(new Date(iso))).toBe(stamp);
  });
});

describe("googleCalendarUrl", () => {
  const start = new Date("2026-11-17T13:17:00+05:30");

  it("builds a template link with a 60-minute default", () => {
    const u = new URL(googleCalendarUrl({ title: "Kamala: Dr. Meera Nair", start }));
    expect(u.origin + u.pathname).toBe("https://calendar.google.com/calendar/render");
    expect(u.searchParams.get("action")).toBe("TEMPLATE");
    expect(u.searchParams.get("text")).toBe("Kamala: Dr. Meera Nair");
    expect(u.searchParams.get("dates")).toBe("20261117T074700Z/20261117T084700Z");
    expect(u.searchParams.get("ctz")).toBe("Asia/Kolkata");
    expect(u.searchParams.has("location")).toBe(false);
  });

  it("honours duration, location and details", () => {
    const u = new URL(
      googleCalendarUrl({ title: "Visit", start, durationMinutes: 30, location: "Sunrise Clinic, Indiranagar", details: "Bring the medicine list" }),
    );
    expect(u.searchParams.get("dates")).toBe("20261117T074700Z/20261117T081700Z");
    expect(u.searchParams.get("location")).toBe("Sunrise Clinic, Indiranagar");
    expect(u.searchParams.get("details")).toBe("Bring the medicine list");
  });

  it("URL-encodes special characters (no injection into other params)", () => {
    const url = googleCalendarUrl({ title: "A & B ?x=1#frag", start, location: "Café / 2nd floor" });
    expect(url).not.toContain(" ");
    expect(url).not.toContain("#frag");
    const u = new URL(url);
    expect(u.searchParams.get("text")).toBe("A & B ?x=1#frag");
    expect(u.searchParams.get("x")).toBeNull();
    expect(u.searchParams.get("location")).toBe("Café / 2nd floor");
  });
});
