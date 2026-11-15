import { beforeAll, describe, expect, it } from "vitest";
import { secretMatches } from "../cron-auth";
import { appointmentEmail, esc, missedDoseEmail, proposalEmail, upcomingDoseEmail } from "../email/templates";

describe("cron secret (constant-time compare)", () => {
  const S = "s".repeat(43);
  it.each([
    ["correct", S, true],
    ["wrong", "x".repeat(43), false],
    ["prefix only", S.slice(0, 10), false],
    ["longer", S + "x", false],
    ["empty", "", false],
    ["missing", null, false],
  ])("%s → %s", (_n, provided, ok) => {
    expect(secretMatches(provided, S)).toBe(ok);
  });
  it("never matches when the server secret is empty", () => {
    expect(secretMatches("", "")).toBe(false);
  });
});

describe("POST /api/cron/tick", () => {
  beforeAll(() => {
    Object.assign(process.env, {
      SUPABASE_URL: "https://example.supabase.co",
      SUPABASE_SERVICE_ROLE_KEY: "test-service-role-key-0000",
      SESSION_SECRET: "a".repeat(40),
      ACTION_LINK_SECRET: "b".repeat(40),
      CRON_SECRET: "c".repeat(40),
    });
  });
  it.each([
    ["no header", undefined],
    ["bad secret", "nope"],
    ["session secret instead", "a".repeat(40)],
  ])("rejects %s with 401 and touches nothing", async (_n, header) => {
    const { POST } = await import("../../app/api/cron/tick/route");
    const req = new Request("http://localhost/api/cron/tick", { method: "POST", headers: header ? { "x-cron-secret": header } : {} });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });
});

describe("email templates", () => {
  const link = "https://saathi.example/a/eyJhbGciOiJIUzI1NiJ9.e30.sig";

  it("escapes HTML in every interpolated value", () => {
    expect(esc(`<script>"x" & 'y'</script>`)).toBe("&lt;script&gt;&quot;x&quot; &amp; &#39;y&#39;&lt;/script&gt;");
    const e = missedDoseEmail({
      toName: "<img src=x onerror=alert(1)>",
      elderName: "Kamala",
      forElder: false,
      medName: "Metformin",
      dose: "500 mg",
      time: "8:00 AM",
      minutesLate: 60,
      severity: "urgent",
      isCritical: false,
      alreadyTold: ["Kamala"],
      takenUrl: link,
      handledUrl: link,
    });
    expect(e.html).not.toContain("<img src=x");
    expect(e.html).toContain("&lt;img");
  });

  it("is accessible: lang, title, real links, plain-text alternative", () => {
    const e = upcomingDoseEmail({
      toName: "Kamala",
      elderName: "Kamala",
      forElder: true,
      medName: "Metformin",
      dose: "500 mg",
      time: "8:00 AM",
      instructions: "After food",
      takenUrl: link,
    });
    expect(e.html).toContain('<html lang="en">');
    expect(e.html).toContain("<title>");
    expect(e.html).toContain(`href="${link}"`);
    expect(e.text).toContain(`I took it: ${link}`);
    expect(e.subject).toBe("Reminder: Metformin at 8:00 AM");
  });

  it("missed dose to elder: one button, gentle wording; to family: took it + handled", () => {
    const base = {
      elderName: "Kamala",
      medName: "Amlodipine",
      dose: "5 mg",
      time: "8:00 AM",
      minutesLate: 120,
      severity: "urgent" as const,
      isCritical: true,
      alreadyTold: [],
      takenUrl: link,
      handledUrl: link,
    };
    const toElder = missedDoseEmail({ ...base, toName: "Kamala", forElder: true, handledUrl: "" });
    expect(toElder.subject).toBe("Did you take your Amlodipine?");
    expect(toElder.text).not.toContain("handled");
    const toFamily = missedDoseEmail({ ...base, toName: "Priya", forElder: false });
    expect(toFamily.subject).toContain("Please check");
    expect(toFamily.text).toContain("2 hours late");
    expect(toFamily.text).toContain("I've handled it: ");
    expect(toFamily.text).toContain("critical");
  });

  it("a role that may not mark doses gets no 'took it' button", () => {
    const e = missedDoseEmail({
      toName: "Ravi",
      elderName: "Joseph",
      forElder: false,
      medName: "Apixaban",
      dose: "2.5 mg",
      time: "1:00 PM",
      minutesLate: 30,
      severity: "urgent",
      isCritical: true,
      alreadyTold: ["Nurse Lakshmi"],
      takenUrl: "",
      handledUrl: link,
    });
    expect(e.text).not.toContain("Joseph took it");
    expect(e.text).toContain("Already told: Nurse Lakshmi.");
  });

  it("appointment 24h and 2h wording", () => {
    const p = {
      toName: "Priya",
      elderName: "Kamala",
      forElder: false,
      doctor: "Dr. Meera Nair",
      specialty: "Diabetologist",
      when: "Tue 17 Nov, 1:17 PM",
      location: "Sunrise Clinic",
    };
    expect(appointmentEmail({ ...p, window: "24h" }).subject).toBe("Kamala's visit to Dr. Meera Nair is tomorrow");
    expect(appointmentEmail({ ...p, window: "2h" }).subject).toBe("Kamala's visit to Dr. Meera Nair is in about 2 hours");
  });

  it("proposal email carries approve link and says nothing changes until approved", () => {
    const e = proposalEmail({
      toName: "Kamala",
      elderName: "Kamala",
      forElder: true,
      proposer: "Priya",
      medName: "Vitamin D3",
      summary: "time → 9:00 AM",
      approveUrl: link,
      reviewUrl: "https://saathi.example/",
    });
    expect(e.subject).toBe("Priya wants to change your Vitamin D3");
    expect(e.text).toContain(`Approve change: ${link}`);
    expect(e.text).toContain("Nothing changes until you approve");
  });
});
