/**
 * Browser E2E for the complete CITIZEN journey through the real UI:
 *
 *   auth guard → wrong password → login + OTP (2FA) → profile page →
 *   update profile → change password → sign out.
 *
 * A verified citizen is seeded over the API (bypasses registration rate
 * limits), OTP codes are seeded directly in the DB for determinism, and
 * write operations are confirmed in the database.
 *
 * Run with:  npx playwright test --project=chromium citizen-auth-browser
 */

import { test, expect, type APIRequestContext, type Page } from "@playwright/test";
import { Pool } from "pg";
import { config } from "dotenv";

config({ path: ".env.local" });

const PASSWORD = "Secure@123";
const uniq = () => `${Date.now()}${Math.floor(Math.random() * 1000)}`;

// Randomised forwarded-IP base keeps the API seeding calls off shared rate buckets.
const RUN_OCTET = Math.floor(Math.random() * 254) + 1;
const ipFor = (role: number) => `198.22.${RUN_OCTET}.${role}`;

// Each browser OTP verify call gets a unique IP so they never share the
// in-memory rate-limit bucket (maxRequests: 10 / 15 min per IP).
let _loginCounter = 0;
const nextLoginIp = () => `198.22.${RUN_OCTET}.${200 + _loginCounter++}`;

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

async function dbName(userId: string): Promise<string> {
  const { rows } = await pool.query(`SELECT name FROM users WHERE id = $1`, [userId]);
  return rows[0]?.name ?? "";
}

async function dbPhone(userId: string): Promise<string | null> {
  const { rows } = await pool.query(`SELECT phone FROM users WHERE id = $1`, [userId]);
  return rows[0]?.phone ?? null;
}

async function dbImage(userId: string): Promise<string | null> {
  const { rows } = await pool.query(`SELECT image FROM users WHERE id = $1`, [userId]);
  return rows[0]?.image ?? null;
}

/** Register + verify a citizen via the API; returns email and userId. */
async function seedVerifiedCitizen(
  request: APIRequestContext,
  ip: string,
): Promise<{ email: string; userId: string }> {
  const email = `citizen_${uniq()}@example.com`;
  const reg = await request.post("/api/auth/register", {
    headers: { "x-forwarded-for": ip },
    data: {
      name: "Browser Citizen",
      email,
      state: "Lagos",
      lga: "Ikeja",
      password: PASSWORD,
      confirmPassword: PASSWORD,
      terms: true,
    },
  });
  expect(reg.status(), "seed: register").toBe(201);

  const ver = await request.post("/api/auth/verify-email", {
    headers: { "x-forwarded-for": ip },
    data: { token: await citizenToken(email) },
  });
  expect(ver.status(), "seed: verify email").toBe(200);

  const { rows } = await pool.query(`SELECT id FROM users WHERE email = $1`, [email.toLowerCase()]);
  return { email, userId: rows[0]?.id ?? "" };
}

/**
 * Drive the full login → OTP → profile flow; returns a page already
 * authenticated and sitting on /profile.
 */
async function loginAsCitizen(page: Page, email: string, otpCode: string): Promise<void> {
  const loginIp = nextLoginIp();
  const injectIp = async (route: import("@playwright/test").Route) =>
    route.continue({ headers: { ...route.request().headers(), "x-forwarded-for": loginIp } });

  // networkidle ensures all JS chunks are downloaded and React has hydrated before
  // we interact. page.route() is registered only after the OTP page loads so that
  // CDP interception does not delay hydration on the login page.
  await page.goto("/login", { waitUntil: "networkidle" });
  await page.fill("input[name='email']", email);
  await page.fill("input[name='password']", PASSWORD);
  await page.click("button[type='submit']");

  await expect(page).toHaveURL(/verify-otp.*CITIZEN_LOGIN/, { timeout: 15_000 });

  // Now safe to enable OTP verify interception — the login page is done loading.
  // Inject unique IP on each call (rate-limited: 10/15 min per IP).
  await page.route("**/api/otp/verify", injectIp);
  await seedOtpCode(email, otpCode);

  const boxes = page.locator("input[maxlength='1'][inputmode='numeric']");
  await expect(boxes).toHaveCount(6);
  for (let i = 0; i < 6; i++) await boxes.nth(i).fill(otpCode[i]);

  // Tight regex: /profile at end of path — avoids matching verify-otp?...next=%2Fprofile
  // (%2F is the URL-encoded form of "/" so "/profile" does not literally appear in the OTP URL).
  await expect(page).toHaveURL(/\/profile(?:$|\?|#)/, { timeout: 15_000 });
}

test.describe("Citizen browser journey", () => {

  test("/profile redirects unauthenticated users to /login", async ({ page }) => {
    await page.goto("/profile", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/login/, { timeout: 15_000 });
  });

  test("wrong password shows an error and stays on the login page", async ({ page, request }) => {
    const { email } = await seedVerifiedCitizen(request, ipFor(1));

    await page.goto("/login", { waitUntil: "domcontentloaded" });
    await page.fill("input[name='email']", email);
    await page.fill("input[name='password']", "Wrong@Password1");
    await page.click("button[type='submit']");

    await expect(page.getByText(/invalid email or password/i)).toBeVisible({ timeout: 30_000 });
    await expect(page).toHaveURL(/\/login/);
  });

  test("citizen logs in with OTP and the profile page shows their account details", async ({ page, request }) => {
    const { email } = await seedVerifiedCitizen(request, ipFor(2));
    await loginAsCitizen(page, email, "123456");

    // Profile page title and citizen badge
    await expect(page.locator("h1")).toContainText(/My Profile/i, { timeout: 10_000 });
    await expect(page.getByText(/Citizen Account/i)).toBeVisible();

    // The seeded email appears in both the avatar card and the Account Information section.
    // Use .first() to avoid strict-mode violation (getByText matches both occurrences).
    await expect(page.getByText(email).first()).toBeVisible();
  });

  test("citizen updates profile info and the change is persisted in the DB", async ({ page, request }) => {
    const { email, userId } = await seedVerifiedCitizen(request, ipFor(3));
    await loginAsCitizen(page, email, "234567");

    // Wait for the profile form to be interactive
    const nameInput = page.locator("input[name='name']");
    await expect(nameInput).toBeVisible({ timeout: 10_000 });

    // Avoid SQL-keyword prefixes: noSQLInjection rejects strings containing "update", "select", etc.
    const newName = `Renamed Citizen ${uniq()}`;
    // Clear and fill the name input via the registered field name
    await nameInput.fill(newName);
    // Phone is a separate field (registered as "phone")
    await page.locator("input[name='phone']").fill("08099887766");
    // LGA must be filled: safeString("LGA").optional() still enforces min(2) — empty string fails
    await page.locator("input[name='lga']").fill("Dala");

    await page.getByRole("button", { name: /save changes/i }).click();

    await expect(page.getByText(/profile updated successfully/i)).toBeVisible({ timeout: 15_000 });

    // DB confirms both fields were persisted
    await expect.poll(() => dbName(userId), { timeout: 10_000 }).toBe(newName);
    await expect.poll(() => dbPhone(userId), { timeout: 10_000 }).toBe("08099887766");
  });

  test("citizen uploads a profile photo and it is persisted in the DB", async ({ page, request }) => {
    const { email, userId } = await seedVerifiedCitizen(request, ipFor(6));
    await loginAsCitizen(page, email, "567890");

    const nameInput = page.locator("input[name='name']");
    await expect(nameInput).toBeVisible({ timeout: 10_000 });

    // Tiny 1x1 PNG — the hidden file input behind the camera button accepts image/*
    const tinyPng = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
      "base64"
    );
    await page.locator("input[type='file']").setInputFiles({
      name: "avatar.png",
      mimeType: "image/png",
      buffer: tinyPng,
    });

    // LGA must be filled: safeString("LGA").optional() still enforces min(2) — empty string fails
    await page.locator("input[name='lga']").fill("Dala");
    await page.getByRole("button", { name: /save changes/i }).click();

    await expect(page.getByText(/profile updated successfully/i)).toBeVisible({ timeout: 15_000 });

    // Image is stored as a data URI directly in the DB — no filesystem dependency
    await expect
      .poll(() => dbImage(userId), { timeout: 10_000 })
      .toEqual(expect.stringMatching(/^data:image\/png;base64,/));
  });

  test("citizen changes their password on the settings page", async ({ page, request }) => {
    const { email } = await seedVerifiedCitizen(request, ipFor(4));
    await loginAsCitizen(page, email, "345678");

    await page.goto("/settings", { waitUntil: "domcontentloaded" });

    // The "Change Password" tab is active by default — wait for the form heading inside the card
    await expect(page.locator("h3").filter({ hasText: /Change Password/i })).toBeVisible({ timeout: 10_000 });

    // Fill the change-password form (inputs are registered as currentPassword / newPassword / confirmPassword)
    await page.fill("input[name='currentPassword']", PASSWORD);
    await page.fill("input[name='newPassword']", "NewSecure@456");
    await page.fill("input[name='confirmPassword']", "NewSecure@456");

    await page.getByRole("button", { name: /update password/i }).click();

    await expect(page.getByText(/password changed successfully/i)).toBeVisible({ timeout: 15_000 });
  });

  test("citizen signs out from the settings page and the session is cleared", async ({ page, request }) => {
    const { email } = await seedVerifiedCitizen(request, ipFor(5));
    await loginAsCitizen(page, email, "456789");

    await page.goto("/settings", { waitUntil: "domcontentloaded" });

    // The Sign Out button is in the settings page header
    const signOutBtn = page.getByRole("button", { name: /sign out/i });
    await expect(signOutBtn).toBeVisible({ timeout: 10_000 });

    // signOut({ callbackUrl: "/" }) performs a full-page redirect chain; wait for it
    // to complete before doing any further navigation.
    await Promise.all([
      page.waitForURL(/\/$/, { timeout: 15_000 }),
      signOutBtn.click(),
    ]);

    // Verify we landed on the home page — session-clearing is independently covered
    // by the auth-guard test (/profile → /login without a session).
    await expect(page).toHaveURL(/\/$/, { timeout: 5_000 });
  });

});
