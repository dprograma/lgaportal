/**
 * Browser E2E for the LGA CHAIRMAN dashboard journey through the real UI:
 *
 *   lga-login → OTP (2FA) → dashboard → publish a post via the modal.
 *
 * A verified LGA/chairman is seeded over the API (so the browser flow isn't
 * subject to registration rate limits), the OTP code is seeded directly for
 * determinism, and the published post is confirmed in the database.
 *
 * Run with:  npx playwright test --project=chromium lga-dashboard-browser
 */

import { test, expect, type APIRequestContext } from "@playwright/test";
import { Pool } from "pg";
import { config } from "dotenv";

config({ path: ".env.local" });

const PASSWORD = "Secure@123";
const uniq = () => `${Date.now()}${Math.floor(Math.random() * 1000)}`;

const RUN_OCTET = Math.floor(Math.random() * 254) + 1;
const ipFor = (role: number) => `198.23.${RUN_OCTET}.${role}`;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
test.afterAll(async () => { await pool.end(); });

async function chairmanToken(email: string): Promise<string> {
  const { rows } = await pool.query(
    `SELECT vt.token FROM lga_verification_tokens vt
       JOIN lga_chairmen c ON c.id = vt."chairmanId"
      WHERE c.email = $1 ORDER BY vt."createdAt" DESC LIMIT 1`,
    [email]
  );
  return rows[0]?.token ?? "";
}

/** Seed a known, unused LGA_LOGIN OTP code directly (deterministic). */
async function seedLgaOtp(email: string, code: string): Promise<void> {
  await pool.query(`DELETE FROM otp_codes WHERE identifier = $1 AND purpose = 'LGA_LOGIN'`, [email.toLowerCase()]);
  await pool.query(
    `INSERT INTO otp_codes (id, identifier, code, purpose, attempts, "expiresAt", "createdAt")
     VALUES (gen_random_uuid()::text, $1, $2, 'LGA_LOGIN', 0, now() + interval '5 minutes', now())`,
    [email.toLowerCase(), code]
  );
}

async function postCount(lgaId: string, title: string): Promise<number> {
  const { rows } = await pool.query(
    `SELECT count(*)::int AS n FROM posts WHERE "lgaId" = $1 AND title = $2`,
    [lgaId, title]
  );
  return rows[0]?.n ?? 0;
}

/** Register + verify an LGA over the API; returns the chairman email + lgaId. */
async function seedVerifiedLGA(request: APIRequestContext, ip: string): Promise<{ email: string; lgaId: string }> {
  const suffix = uniq();
  const email = `chairman_${suffix}@example.com`;
  const reg = await request.post("/api/lga/register", {
    headers: { "x-forwarded-for": ip },
    data: {
      lgaName: `Browserville ${suffix}`, state: "Lagos", chairmanName: "Chief Browser",
      email, phone: "08012345678", officeAddress: "1 Council Road, Ikeja",
      sectors: ["Health"], password: PASSWORD, confirmPassword: PASSWORD, terms: true,
    },
  });
  expect(reg.status(), "seed: LGA register").toBe(201);
  const { lgaId } = await reg.json();
  const ver = await request.post("/api/lga/verify", { data: { token: await chairmanToken(email) } });
  expect(ver.status(), "seed: LGA verify").toBe(200);
  return { email, lgaId };
}

test.describe("LGA chairman dashboard journey — browser", () => {
  test("the dashboard redirects to lga-login when not authenticated", async ({ page }) => {
    await page.goto("/lga-dashboard", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/lga-login/, { timeout: 15_000 });
  });

  test("chairman logs in, passes OTP, reaches the dashboard and publishes a post", async ({ page, request }) => {
    const { email, lgaId } = await seedVerifiedLGA(request, ipFor(1));

    // 1) Sign in through the LGA login form.
    await page.goto("/lga-login", { waitUntil: "domcontentloaded" });
    await page.fill("input[name='email']", email);
    await page.fill("input[name='password']", PASSWORD);
    await page.click("button[type='submit']");

    // 2) Land on the OTP (2FA) step, then complete it with a seeded code.
    await expect(page).toHaveURL(/verify-otp.*LGA_LOGIN/, { timeout: 15_000 });
    const code = "123456";
    await seedLgaOtp(email, code);
    const boxes = page.locator("input[maxlength='1'][inputmode='numeric']");
    await expect(boxes).toHaveCount(6);
    for (let i = 0; i < 6; i++) await boxes.nth(i).fill(code[i]);

    // 3) The OTP page stores the session and redirects to the dashboard.
    await expect(page).toHaveURL(/\/lga-dashboard/, { timeout: 15_000 });

    // 4) Publish a post through the dashboard UI.
    await page.goto("/lga-dashboard/posts", { waitUntil: "domcontentloaded" });
    await page.getByRole("button", { name: /new post|create post/i }).first().click();

    const title = `Ward briefing ${uniq()}`;
    await page.fill("input[placeholder='Post title…']", title);
    await page.fill("textarea[placeholder='Write your post content here…']", "An official update published from the dashboard UI during an E2E test.");
    await page.getByRole("button", { name: /publish post/i }).click();

    // 5) The UI confirms success…
    await expect(page.getByText(/post published successfully/i)).toBeVisible({ timeout: 15_000 });

    // …and the post is really persisted under this LGA.
    await expect.poll(() => postCount(lgaId, title), { timeout: 10_000 }).toBe(1);
  });
});
