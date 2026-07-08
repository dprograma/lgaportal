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
      testMatch: /(?:fr\d+-?(?:fr\d+)?|admin-auth|auth-e2e|citizen-lga-e2e|lga-portal-auth-e2e|investor-lga-e2e|chairman-crud-e2e|public-content-e2e|admin-surface-e2e|payments-e2e|landing-reframe)\.spec\.ts$/,
      use: {},
    },
    // Browser tests — real UI journeys through the pages.
    // Run with: npx playwright test --project=chromium
    // Set PW_CHROMIUM_PATH to use a pre-installed Chromium (e.g. in this
    // environment); otherwise Playwright uses the browser from
    // `npx playwright install chromium` (as CI does).
    {
      name: "chromium",
      testMatch: /-browser\.spec\.ts$/,
      use: {
        ...devices["Desktop Chrome"],
        ...(process.env.PW_CHROMIUM_PATH
          ? { launchOptions: { executablePath: process.env.PW_CHROMIUM_PATH } }
          : {}),
      },
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
