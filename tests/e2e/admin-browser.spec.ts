/**
 * Browser E2E for the admin journey through the real UI:
 *
 *   /admin/login → dashboard → approve a pending LGA → ban a citizen user.
 *
 * A pending LGA and a citizen are seeded over the API, then Chromium drives
 * the real admin UI. All assertions double-check the DB for persistence.
 *
 * Run with:  npx playwright test --project=chromium admin-browser
 */

import { test, expect, type APIRequestContext } from "@playwright/test";
import { Pool } from "pg";
import { config } from "dotenv";

config({ path: ".env.local" });

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "Admin@Test123";
const CITIZEN_PASSWORD = "Secure@123";
const uniq = () => `${Date.now()}${Math.floor(Math.random() * 1000)}`;

const RUN_OCTET = Math.floor(Math.random() * 254) + 1;
const ipFor = (role: number) => `198.25.${RUN_OCTET}.${role}`;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
test.afterAll(async () => { await pool.end(); });

async function lgaStatus(lgaId: string): Promise<string> {
  const { rows } = await pool.query(`SELECT status FROM lgas WHERE id = $1`, [lgaId]);
  return rows[0]?.status ?? "";
}

async function userBanned(email: string): Promise<boolean> {
  const { rows } = await pool.query(
    `SELECT "isBanned" FROM users WHERE email = $1`,
    [email.toLowerCase()]
  );
  return rows[0]?.isBanned ?? false;
}

async function citizenVerToken(email: string): Promise<string> {
  const { rows } = await pool.query(
    `SELECT vt.token FROM verification_tokens vt
       JOIN users u ON u.id = vt."userId"
      WHERE u.email = $1 ORDER BY vt."createdAt" DESC LIMIT 1`,
    [email]
  );
  return rows[0]?.token ?? "";
}

async function lgarVerToken(email: string): Promise<string> {
  const { rows } = await pool.query(
    `SELECT vt.token FROM lga_verification_tokens vt
       JOIN lga_chairmen c ON c.id = vt."chairmanId"
      WHERE c.email = $1 ORDER BY vt."createdAt" DESC LIMIT 1`,
    [email]
  );
  return rows[0]?.token ?? "";
}

/** Seed a pending (unverified-but-registered) LGA via API. */
async function seedPendingLGA(request: APIRequestContext, ip: string): Promise<{ lgaId: string; lgaName: string }> {
  const suffix  = uniq();
  const lgaName = `AdminTest ${suffix}`;
  const email   = `chairman_adm_${suffix}@example.com`;

  const reg = await request.post("/api/lga/register", {
    headers: { "x-forwarded-for": ip },
    data: {
      lgaName, state: "Kano", chairmanName: "Alhaji Admin",
      email, phone: "08011223344", officeAddress: "3 Council Close, Kano",
      sectors: ["Agriculture"], password: CITIZEN_PASSWORD,
      confirmPassword: CITIZEN_PASSWORD, terms: true,
    },
  });
  expect(reg.status(), "seed: LGA register").toBe(201);
  const { lgaId } = await reg.json();

  // Verify email so the LGA chairman can log in, but leave status = PENDING
  const token = await lgarVerToken(email);
  const ver = await request.post("/api/lga/verify", { data: { token } });
  expect(ver.status(), "seed: LGA verify").toBe(200);

  return { lgaId, lgaName };
}

/** Seed a verified citizen via API. */
async function seedVerifiedCitizen(request: APIRequestContext, ip: string): Promise<{ userId: string; email: string; name: string }> {
  const suffix = uniq();
  const email  = `citizen_adm_${suffix}@example.com`;
  const name   = `Citizen Admin ${suffix}`;

  const reg = await request.post("/api/auth/register", {
    headers: { "x-forwarded-for": ip },
    data: { name, email, state: "Lagos", lga: "Ikeja", password: CITIZEN_PASSWORD, confirmPassword: CITIZEN_PASSWORD, terms: true },
  });
  expect(reg.status(), "seed: register").toBe(201);

  const token = await citizenVerToken(email);
  const ver = await request.post("/api/auth/verify-email", { data: { token } });
  expect(ver.status(), "seed: verify email").toBe(200);

  const { rows } = await pool.query(`SELECT id FROM users WHERE email = $1`, [email.toLowerCase()]);
  return { userId: rows[0]?.id ?? "", email, name };
}

/** Log into the admin panel; returns a page already on /admin. */
async function adminLogin(page: import("@playwright/test").Page): Promise<void> {
  await page.goto("/admin/login", { waitUntil: "domcontentloaded" });
  await page.fill("input[type='password']", ADMIN_PASSWORD);
  await page.click("button[type='submit']");
  await expect(page).toHaveURL(/\/admin$/, { timeout: 15_000 });
}

test.describe("Admin browser journey", () => {
  test("wrong password shows an error and stays on the login page", async ({ page }) => {
    await page.goto("/admin/login", { waitUntil: "domcontentloaded" });
    await page.fill("input[type='password']", "totally-wrong-password");
    await page.click("button[type='submit']");
    await expect(page.getByText(/incorrect|wrong|invalid/i)).toBeVisible({ timeout: 10_000 });
    await expect(page).toHaveURL(/\/admin\/login/);
  });

  test("correct password logs in and the dashboard renders LGA stats", async ({ page }) => {
    await adminLogin(page);
    // Dashboard should show counts / stat cards
    await expect(page.locator("body")).toContainText(/pending|approved|LGA/i, { timeout: 15_000 });
  });

  test("admin approves a pending LGA", async ({ page, request }) => {
    const { lgaId, lgaName } = await seedPendingLGA(request, ipFor(1));

    await adminLogin(page);
    await page.goto("/admin/lgas", { waitUntil: "domcontentloaded" });

    // Filter by PENDING tab
    await page.getByRole("button", { name: /^Pending$/i }).click();

    // Search for the seeded LGA so it's visible
    await page.fill("input[placeholder*='Search']", lgaName);

    // Wait for the row and click Approve
    const approveBtn = page.getByRole("button", { name: /^Approve$/i }).first();
    await expect(approveBtn).toBeVisible({ timeout: 15_000 });
    await approveBtn.click();

    // Toast success
    await expect(page.getByText(/approved/i)).toBeVisible({ timeout: 10_000 });

    // DB confirms the status changed
    await expect.poll(() => lgaStatus(lgaId), { timeout: 10_000 }).toBe("APPROVED");
  });

  test("admin bans a citizen user", async ({ page, request }) => {
    const { email, name } = await seedVerifiedCitizen(request, ipFor(2));

    await adminLogin(page);
    await page.goto("/admin/users", { waitUntil: "domcontentloaded" });

    // Search for the seeded citizen
    await page.fill("input[placeholder*='Search']", email);

    // Click Ban on that user's row
    const banBtn = page.getByRole("button", { name: /^Ban$/i }).first();
    await expect(banBtn).toBeVisible({ timeout: 15_000 });
    await banBtn.click();

    // Modal opens — fill the ban reason textarea
    await expect(page.getByText(/ban user/i)).toBeVisible({ timeout: 5_000 });
    await page.fill("textarea[placeholder*='Reason']", "Violation of platform terms during E2E test.");

    // Confirm
    await page.getByRole("button", { name: /confirm ban/i }).click();

    // Toast success (exact text avoids matching the BANNED status badge + dropdown option)
    await expect(page.getByText("User banned.", { exact: true })).toBeVisible({ timeout: 10_000 });

    // DB confirms the ban
    await expect.poll(() => userBanned(email), { timeout: 10_000 }).toBe(true);
  });

  test("/admin/lgas redirects unauthenticated visitors to /admin/login", async ({ page }) => {
    // Navigate directly without logging in first
    await page.goto("/admin/lgas", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/admin\/login/, { timeout: 15_000 });
  });
});
