/**
 * Playwright config for the v4 shell.
 *
 * Test layout note (intentional convention split, worth a future
 * maintainer's attention):
 *   - tests/   — Playwright e2e (plural; Playwright convention)
 *   - test/    — Vitest unit/integration/property (singular; pre-v4
 *                convention; not touched by Playwright)
 *
 * v4.0 ships one smoke in tests/e2e/. The browser matrix is the
 * three Playwright engines that run on Ubuntu CI runners (Chromium,
 * Firefox, WebKit). Safari-native testing is best-effort per v4
 * design spec § 9 and is NOT in this CI matrix.
 */

import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: "http://localhost:5173",
    trace: "on-first-retry",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "firefox", use: { ...devices["Desktop Firefox"] } },
    { name: "webkit", use: { ...devices["Desktop Safari"] } },
  ],
  webServer: {
    command: "pnpm dev --port 5173 --strictPort",
    url: "http://localhost:5173",
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
