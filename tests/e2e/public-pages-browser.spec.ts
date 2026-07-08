/**
 * Browser smoke tests — every key public page renders in a real browser
 * (no JS errors that blank the page, a title, and expected content present).
 *
 * Run with:  npx playwright test --project=chromium public-pages-browser
 */

import { test, expect } from "@playwright/test";

const PAGES: Array<{ path: string; expect: RegExp }> = [
  { path: "/",            expect: /LGA|Local Government|Nigeria|invest/i },
  { path: "/about",       expect: /about|mission|story/i },
  { path: "/how-it-works",expect: /how it works|step|citizen|investor/i },
  { path: "/faqs",        expect: /faq|question/i },
  { path: "/lgas",        expect: /LGA|Local Government/i },
  { path: "/map",         expect: /map|state|LGA/i },
  { path: "/invest",      expect: /invest|opportunit|endowment/i },
  { path: "/contact",     expect: /contact|message|email/i },
  { path: "/login",       expect: /sign in|log in|email/i },
  { path: "/signup",      expect: /sign up|create|account/i },
  { path: "/lga-login",   expect: /LGA|sign in|administrator/i },
  { path: "/lga-signup",  expect: /LGA|register|chairman/i },
];

test.describe("Public pages render", () => {
  for (const { path, expect: rx } of PAGES) {
    test(`${path} loads with content`, async ({ page }) => {
      const res = await page.goto(path, { waitUntil: "domcontentloaded" });
      expect(res, `no response for ${path}`).toBeTruthy();
      expect(res!.status(), `bad status for ${path}`).toBeLessThan(400);
      await expect(page).toHaveTitle(/.+/);
      await expect(page.locator("body")).toContainText(rx, { timeout: 15_000 });
    });
  }

  test("landing page 'Sign up' link navigates to the signup page", async ({ page }) => {
    await page.goto("/login", { waitUntil: "domcontentloaded" });
    await page.getByRole("link", { name: /sign up/i }).first().click();
    await expect(page).toHaveURL(/\/signup/);
  });
});
