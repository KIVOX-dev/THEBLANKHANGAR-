import { defineConfig, devices } from "@playwright/test";

const PORT = 3000;
const baseURL = `http://localhost:${PORT}`;

/**
 * The backend (+ a seeded database) is expected to already be running, same as any other
 * manual dev/test session — this config only manages the frontend. `reuseExistingServer`
 * is always true: locally that reuses a `next dev` you already have open; in CI, the
 * workflow starts the built frontend itself (after the backend is confirmed healthy) so
 * Playwright just detects it's already up rather than racing it. See
 * .github/workflows/ci.yml.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: "list",
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "npm run dev",
    url: baseURL,
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
