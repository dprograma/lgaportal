/**
 * Browser E2E for the CITIZEN authentication journey through the real UI:
 *
 *   sign-in form → credentials accepted → OTP (2FA) step → profile page.
 *
 * A verified citizen is seeded over the API (so the browser test isn't subject
 * to the registration rate limit), then the login + OTP UI is driven for real.
 *
 * Run with:  npx playwright test --project=chromium citizen-auth-browser
 */

import { test, expect, type APIRequestContext } from "@playwright/test";
import { Pool } from "pg";
import { config } from "dotenv";

config({ path: ".env.local" });

const PASSWORD = "Secure@123";
const uniq = () => `${Date.now()}${Math.floor(Math.random() * 1000)}`;

// Randomized forwarded-IP base keeps the API seeding calls off shared rate buckets.
const RUN_OCTET = Math.floor(Math.random() * 254) + 1;
const ipFor = (role: number) => `198.22.${RUN_OCTET}.${role}`;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
test.afterAll(async () => { await pool.end(); });

async function citizenToken(email: string): Promise<string> {
  const { rows } = await pool.query(
    `SELECT vt.token FROM verification_tokens vt
       JOIN users u ON u.id = vt."userId"
      WHERE u.email = $1 ORDER BY vt."createdAt" DESC LIMIT 1`,
    [email]
  );
  return rows[0]?.token ?? "";
}

/** Seed a known, unused OTP code directly (deterministic — avoids the send rate limit). */
async function seedOtpCode(email: string, code: string): Promise<void> {
  await pool.query(
    `DELETE FROM otp_codes WHERE identifier = $1 AND purpose = 'CITIZEN_LOGIN'`,
    [email.toLowerCase()]
  );
  await pool.query(
    `INSERT INTO otp_codes (id, identifier, code, purpose, attempts, "expiresAt", "createdAt")
     VALUES (gen_random_uuid()::text, $1, $2, 'CITIZEN_LOGIN', 0, now() + interval '5 minutes', now())`,
    [email.toLowerCase(), code]
  );
}

/** Register + verify a citizen via the API; returns the email. */
async function seedVerifiedCitizen(request: APIRequestContext, ip: string): Promise<string> {
  const email = `citizen_${uniq()}@example.com`;
  const reg = await request.post("/api/auth/register", {
    headers: { "x-forwarded-for": ip },
    data: { name: "Browser Citizen", email, state: "Lagos", lga: "Ikeja", password: PASSWORD, confirmPassword: PASSWORD, terms: true },
  });
  expect(reg.status(), "seed: register").toBe(201);
  const ver = await request.post("/api/auth/verify-email", { data: { token: await citizenToken(email) } });
  expect(ver.status(), "seed: verify email").toBe(200);
  return email;
}

test.describe("Citizen auth journey — browser", () => {
  test("valid credentials advance to the OTP (2FA) step", async ({ page, request }) => {
    const email = await seedVerifiedCitizen(request, ipFor(1));

    await page.goto("/login", { waitUntil: "domcontentloaded" });
    await page.fill("input[name='email']", email);
    await page.fill("input[name='password']", PASSWORD);
    await page.click("button[type='submit']");

    await expect(page).toHaveURL(/verify-otp.*CITIZEN_LOGIN/, { timeout: 15_000 });
    await expect(page.locator("body")).toContainText(/verify your identity|6-digit/i);
  });

  test("wrong password shows an error and stays on the login page", async ({ page, request }) => {
    const email = await seedVerifiedCitizen(request, ipFor(2));

    await page.goto("/login", { waitUntil: "domcontentloaded" });
    await page.fill("input[name='email']", email);
    await page.fill("input[name='password']", "Wrong@Password1");
    await page.click("button[type='submit']");

    await expect(page.getByText(/invalid email or password/i)).toBeVisible({ timeout: 15_000 });
    await expect(page).toHaveURL(/\/login/);
  });

  test("completing the OTP lands the citizen on their profile", async ({ page, request }) => {
    const ip = ipFor(3);
    const email = await seedVerifiedCitizen(request, ip);

    await page.goto("/login", { waitUntil: "domcontentloaded" });
    await page.fill("input[name='email']", email);
    await page.fill("input[name='password']", PASSWORD);
    await page.click("button[type='submit']");
    await expect(page).toHaveURL(/verify-otp/, { timeout: 15_000 });

    // Seed a known OTP code directly (deterministic; not subject to send limits).
    const code = "123456";
    await seedOtpCode(email, code);

    // Fill the 6 OTP boxes — the form auto-submits on the last digit.
    const boxes = page.locator("input[maxlength='1'][inputmode='numeric']");
    await expect(boxes).toHaveCount(6);
    for (let i = 0; i < 6; i++) await boxes.nth(i).fill(code[i]);

    await expect(page).toHaveURL(/\/profile/, { timeout: 15_000 });
  });
});
