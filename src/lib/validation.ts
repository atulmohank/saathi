import { z } from "zod";
import { CHANGE_SOURCES, MISS_REASONS, MODES, ROLES } from "./engine/types";

export const LANGS = ["en", "hi", "ta", "te", "kn", "ml"] as const;
export type Lang = (typeof LANGS)[number];

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
const trimmed = (max: number, min = 1) => z.string().trim().min(min).max(max);

export const uuid = z.uuid();
export const timeHHmm = z.string().regex(TIME_RE, "Use 24-hour HH:mm, e.g. 08:30");
export const passcode = z.string().regex(/^\d{4,8}$/, "Passcode must be 4–8 digits");

export const loginSchema = z.object({ memberId: uuid, passcode });
export const demoLoginSchema = z.object({
  persona: z.enum(["kamala", "priya", "lakshmi", "joseph", "ravi"]),
});

export const medicineSchema = z.object({
  name: trimmed(80),
  doseText: trimmed(60),
  times: z.array(timeHHmm).min(1).max(8).refine((t) => new Set(t).size === t.length, "Times must be unique"),
  pillLook: trimmed(40),
  instructions: trimmed(300, 0).default(""),
  stockCount: z.number().int().min(0).max(10000),
  isCritical: z.boolean().default(false),
});
export type MedicineInput = z.infer<typeof medicineSchema>;

export const markDoseSchema = z.object({
  doseEventId: uuid,
  status: z.enum(["taken", "skipped"]),
  reason: z.enum(MISS_REASONS).nullable().default(null),
});

export const changeProposalSchema = z.object({
  elderId: uuid,
  medicineId: uuid.nullable(),
  source: z.enum(CHANGE_SOURCES),
  diff: medicineSchema.partial(),
});

export const appointmentSchema = z.object({
  doctorName: trimmed(80),
  specialty: trimmed(80, 0).default(""),
  location: trimmed(160, 0).default(""),
  startsAt: z.iso.datetime({ offset: true }),
  notes: trimmed(500, 0).default(""),
});

export const memberSchema = z.object({
  displayName: trimmed(60),
  email: z.email().max(254).optional().or(z.literal("")),
  role: z.enum(ROLES),
  passcode,
});

export const elderSchema = z.object({
  displayName: trimmed(60),
  age: z.number().int().min(40).max(120),
  autonomyMode: z.enum(MODES),
  preferredLanguage: z.enum(LANGS).default("en"),
});

const shortList = z.array(trimmed(60)).max(10).default([]);

export const emergencySchema = z.object({
  bloodGroup: z.enum(["", "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]).default(""),
  allergies: shortList,
  conditions: shortList,
  doctorName: trimmed(80, 0).default(""),
  doctorPhone: z.string().trim().regex(/^[+\d][\d\s-]{0,19}$|^$/, "Phone: digits, spaces, + and - only").default(""),
});

export const circleCodeSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z0-9]{4,8}$/, "Circle code is 4–8 letters or digits");

export const createCircleSchema = z.object({
  circleName: trimmed(80),
  elder: elderSchema.extend({ emergency: emergencySchema }),
  /** First member is the person creating the circle (signed in afterwards). */
  members: z
    .array(memberSchema)
    .min(1)
    .max(10)
    .refine((ms) => new Set(ms.map((m) => m.displayName.toLowerCase())).size === ms.length, "Each member needs a different name")
    .refine((ms) => ms.filter((m) => m.role === "elder").length <= 1, "Only one member can be the elder"),
});
export type CreateCircleInput = z.infer<typeof createCircleSchema>;
