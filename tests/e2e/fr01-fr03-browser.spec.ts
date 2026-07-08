/**
 * Browser-based E2E tests for FR-01 to FR-03 UI flows.
 * Requires: npx playwright install chromium
 */

import { test, expect } from "@playwright/test";

test.describe("FR-01-01: Signup page UI", () => {
  test("renders all required fields", async ({ page }) => {
    await page.goto("/signup");
    await expect(page.locator("input[name='name']")).toBeVisible();
    await expect(page.locator("input[name='email']")).toBeVisible();
    await expect(page.locator("input[name='password']")).toBeVisible();
    await expect(page.locator("input[name='confirmPassword']")).toBeVisible();
  });

  test("submitting valid data redirects to verify-email", async ({ page }) => {
    const email = `e2e+${Date.now()}@mailinator.com`;
    await page.goto("/signup", { waitUntil: "domcontentloaded" });

    // state/terms wrap native <select>/<input> in styled markup, so drive them
    // directly (force) rather than relying on visibility.
    await page.fill("input[name='name']", "E2E Test User");
    await page.fill("input[name='email']", email);
    await page.fill("input[name='phone']", "08012345678");
    await page.selectOption("select[name='state']", { label: "Lagos" });
    await page.fill("input[name='lga']", "Ikeja");
    await page.fill("input[name='password']", "Secure@123");
    await page.fill("input[name='confirmPassword']", "Secure@123");
    // The terms checkbox has a JSX label (no name/id); click its label text,
    // which wraps and toggles the underlying checkbox.
    await page.getByText(/I have read and agree/i).click();

    await page.click("button[type='submit']");
    await expect(page).toHaveURL(/verify-email/, { timeout: 15_000 });
  });
});

test.describe("FR-01-05: OTP verify page UI", () => {
  test("renders 6 digit input boxes", async ({ page }) => {
    await page.goto("/verify-otp?email=test%40example.com&purpose=CITIZEN_LOGIN");
    const inputs = page.locator(
      "input[type='text'], input[inputmode='numeric'], input[maxlength='1']"
    );
    expect(await inputs.count()).toBeGreaterThanOrEqual(6);
  });
});

test.describe("FR-02-01: LGA signup page UI", () => {
  test("renders LGA-related content", async ({ page }) => {
    await page.goto("/lga-signup");
    await expect(page).toHaveTitle(/.+/);
    const body = await page.content();
    expect(body).toMatch(/LGA|Local Government|Chairman/i);
  });
});

test.describe("FR-02-05: LGA login page UI", () => {
  test("renders email and password fields", async ({ page }) => {
    await page.goto("/lga-login");
    await expect(page.locator("input[name='email']")).toBeVisible();
    await expect(page.locator("input[name='password']")).toBeVisible();
  });
});
