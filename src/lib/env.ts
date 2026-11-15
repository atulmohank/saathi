import "server-only";
import { z } from "zod";

const schema = z.object({
  SUPABASE_URL: z.url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(20),
  SESSION_SECRET: z.string().min(32),
  ACTION_LINK_SECRET: z.string().min(32),
  CRON_SECRET: z.string().min(16),
  GMAIL_USER: z.string().default(""),
  GMAIL_APP_PASSWORD: z.string().default(""),
  GEMINI_API_KEY: z.string().default(""),
  GEMINI_MODEL: z.string().default("gemini-3.8-flash"),
  APP_BASE_URL: z.url().default("http://localhost:3000"),
  DEMO_EMAIL_SINK: z.string().default(""),
});

let cached: z.infer<typeof schema> | null = null;

export function env() {
  if (!cached) {
    const parsed = schema.safeParse(process.env);
    if (!parsed.success) {
      const missing = parsed.error.issues.map((i) => i.path.join(".")).join(", ");
      throw new Error(`Invalid server environment: ${missing}`);
    }
    cached = parsed.data;
  }
  return cached;
}

/**
 * Public base URL for links in emails. On Vercel, if APP_BASE_URL is missing or
 * still localhost, fall back to the project's production domain (system env).
 */
export function appBaseUrl(): string {
  const v = env().APP_BASE_URL.replace(/\/$/, "");
  const prod = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (process.env.VERCEL && /localhost|127\.0\.0\.1/.test(v) && prod) return `https://${prod}`;
  return v;
}
