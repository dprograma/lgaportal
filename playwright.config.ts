import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  retries: 0,
  workers: 1,
  reporter: "list",
  timeout: 60_000,
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [
    // API-only project — no browser binary required
    // Run with: npx playwright test --project=api
    {
      name: "api",
      testMatch: /(?:fr\d+-?(?:fr\d+)?|admin-auth)\.spec\.ts$/,
      use: {},
    },
    // Browser tests — requires: npx playwright install chromium
    // Run with: npx playwright test --project=chromium
    {
      name: "chromium",
      testMatch: /fr01-fr03-browser\.spec\.ts$/,
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  // Start dev server before tests if not already running
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
