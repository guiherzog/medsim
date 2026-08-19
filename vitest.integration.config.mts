import { defineConfig } from "vitest/config";

/**
 * Separate from vitest.config.mts on purpose: these tests hit the live
 * Supabase project over the network and need .env.local's credentials, so
 * they're opt-in via `pnpm test:integration`, never part of the fast
 * hermetic `pnpm test` unit-test loop.
 */
export default defineConfig({
  test: {
    include: ["tests/integration/**/*.test.ts"],
    setupFiles: ["tests/integration/setup.ts"],
    testTimeout: 30000,
  },
});
