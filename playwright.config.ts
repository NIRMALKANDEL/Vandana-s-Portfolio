import { defineConfig, devices } from "@playwright/test";

/**
 * Two targets:
 *  - "site": the production build (npm run build && npm start) on :3100
 *  - "desk": the dev server on :3200 with DESK_DEV_BYPASS=true, so the writing desk can be
 *            exercised without a real Google account (the bypass is ignored in production).
 */
const SITE = process.env.SITE_URL || "http://localhost:3100";
const DESK = process.env.DESK_URL || "http://localhost:3200";

export default defineConfig({
  testDir: "./tests",
  timeout: 60_000,
  expect: { timeout: 8_000 },
  fullyParallel: true,
  workers: process.env.CI ? 2 : 4,
  reporter: [["list"], ["json", { outputFile: "qa/results.json" }]],
  use: { trace: "retain-on-failure", ...devices["Desktop Chrome"] },
  projects: [
    { name: "site", testIgnore: /desk\.spec\.ts/, use: { baseURL: SITE } },
    { name: "desk", testMatch: /desk\.spec\.ts/, use: { baseURL: DESK } },
  ],
  webServer: [
    { command: "npm run start -- -p 3100", url: SITE, reuseExistingServer: true, timeout: 120_000 },
    { command: "DESK_DEV_BYPASS=true NEXT_DIST_DIR=.next-dev npm run dev -- -p 3200", url: DESK, reuseExistingServer: true, timeout: 180_000 },
  ],
});
