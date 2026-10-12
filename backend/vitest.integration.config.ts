import { defineConfig } from "vitest/config";
import path from "node:path";

/**
 * Integration tests exercise real Prisma transactions (stock decrement/restock,
 * order creation) against a local MongoDB replica set — the same one docker-compose.yml
 * provisions for development. They intentionally do NOT run as part of the default
 * `vitest` unit-test pass so contributors without Docker running aren't blocked.
 */
export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/integration/**/*.test.ts"],
    setupFiles: ["./tests/integration/setup.ts"],
    hookTimeout: 30_000,
    testTimeout: 30_000,
    fileParallelism: false,
  },
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
    },
  },
});
