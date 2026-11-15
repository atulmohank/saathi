import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    coverage: {
      provider: "v8",
      include: ["src/lib/**/*.ts"],
      // I/O glue covered by route integration tests or exercised end-to-end, not unit-tested here.
      exclude: ["src/lib/**/__tests__/**", "src/lib/db.ts", "src/lib/env.ts", "src/lib/demo/seed.ts"],
      reporter: ["text-summary", "text"],
      thresholds: { "src/lib/engine/**": { lines: 95, functions: 95, branches: 90, statements: 95 }, lines: 40, functions: 40 },
    },
  },
  resolve: { alias: { "@": path.resolve(import.meta.dirname, "src"), "server-only": path.resolve(import.meta.dirname, "src/test/server-only-stub.ts") } },
});
