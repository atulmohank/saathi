// Usage: npm run seed   (reads .env.local; recreates the fictional demo circle)
import { createClient } from "@supabase/supabase-js";
import { seedDemo } from "../src/lib/demo/seed";

process.loadEnvFile(".env.local");
const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false },
});

seedDemo(sb)
  .then(({ circleId }) => console.log("Demo circle seeded:", circleId))
  .catch((e) => {
    console.error(e instanceof Error ? e.message : e);
    process.exit(1);
  });
