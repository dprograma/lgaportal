/**
 * Browser E2E for the investor journey through the real UI:
 *
 *   /invest registration page renders → /lgas/[slug] Investment tab →
 *   "Express Interest" modal → submit inquiry confirmed in DB.
 *
 * An approved LGA with a published endowment is seeded via the API, then
 * Chromium drives the public profile page and the inquiry modal.
 *
 * Run with:  npx playwright test --project=chromium investor-browser
 */

import { test, expect, type APIRequestContext } from "@playwright/test";
import { Pool } from "pg";
import { config } from "dotenv";

config({ path: ".env.local" });

const PASSWORD = "Secure@123";
const uniq = () => `${Date.now()}${Math.floor(Math.random() * 1000)}`;

const RUN_OCTET = Math.floor(Math.random() * 254) + 1;
const ipFor = (role: number) => `198.24.${RUN_OCTET}.${role}`;

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

async function seedLgaOtp(email: string, code: string): Promise<void> {
  await pool.query(`DELETE FROM otp_codes WHERE identifier = $1 AND purpose = 'LGA_LOGIN'`, [email.toLowerCase()]);
  await pool.query(
    `INSERT INTO otp_codes (id, identifier, code, purpose, attempts, "expiresAt", "createdAt")
     VALUES (gen_random_uuid()::text, $1, $2, 'LGA_LOGIN', 0, now() + interval '5 minutes', now())`,
    [email.toLowerCase(), code]
  );
}

async function inquiryCount(lgaId: string, investorEmail: string): Promise<number> {
  const { rows } = await pool.query(
    `SELECT count(*)::int AS n FROM investor_inquiries iq
       JOIN investors i ON i.id = iq."investorId"
      WHERE iq."lgaId" = $1 AND i.email = $2`,
    [lgaId, investorEmail]
  );
  return rows[0]?.n ?? 0;
}

/**
 * Registers + verifies + approves an LGA, then publishes one endowment.
 * Returns the LGA's public URL slug, id, and the endowment id.
 */
async function seedApprovedLGAWithEndowment(
  request: APIRequestContext,
  ip: string,
): Promise<{ lgaId: string; slug: string }> {
  const suffix   = uniq();
  const lgaName  = `Investville ${suffix}`;
  const email    = `chairman_inv_${suffix}@example.com`;

  // 1. Register
  const reg = await request.post("/api/lga/register", {
    headers: { "x-forwarded-for": ip },
    data: {
      lgaName, state: "Lagos", chairmanName: "Chief Investor",
      email, phone: "08012345678", officeAddress: "2 Investment Road, Ikeja",
      sectors: ["Agriculture"], password: PASSWORD, confirmPassword: PASSWORD, terms: true,
    },
  });
  expect(reg.status(), "seed: LGA register").toBe(201);
  const { lgaId } = await reg.json();

  // 2. Verify email
  const ver = await request.post("/api/lga/verify", { data: { token: await chairmanToken(email) } });
  expect(ver.status(), "seed: LGA verify").toBe(200);

  // 3. Approve in DB (normally done by admin)
  await pool.query(`UPDATE lgas SET status = 'APPROVED' WHERE id = $1`, [lgaId]);

  // 4. Authenticate as chairman to obtain lga_session cookie on the request context.
  //    Seed OTP directly; skip the email-send step.
  const otpCode = "789012";
  await seedLgaOtp(email, otpCode);
  const otpRes = await request.post("/api/otp/verify", {
    data: { identifier: email, code: otpCode, purpose: "LGA_LOGIN" },
  });
  expect(otpRes.status(), "seed: OTP verify").toBe(200);

  // 5. Publish an endowment (lga_session cookie is now set on the request context).
  const endRes = await request.post("/api/lgas/endowments", {
    data: {
      category: "AGRICULTURE",
      title: "Rich farmland in the valley",
      description: "Fertile alluvial soil suitable for large-scale farming operations.",
      highlights: ["2,000 ha available", "Year-round irrigation", "Proximity to market"],
      investmentRange: "₦50M – ₦500M",
      isPublished: true,
    },
  });
  expect(endRes.status(), "seed: endowment publish").toBe(201);

  // Slug: LGA name lowercased, spaces → hyphens (mirrors the by-slug lookup)
  const slug = lgaName.toLowerCase().replace(/\s+/g, "-");
  return { lgaId, slug };
}

test.describe("Investor browser journey", () => {
  test("/invest page shows the investor registration form", async ({ page }) => {
    await page.goto("/invest", { waitUntil: "domcontentloaded" });
    await expect(page.locator("body")).toContainText(/investor|invest|register/i, { timeout: 10_000 });
    const emailInput = page.locator("input[name='email'], input[type='email']").first();
    await expect(emailInput).toBeVisible();
  });

  test("investor browses an LGA Investment tab and submits an inquiry", async ({ page, request }) => {
    const { lgaId, slug } = await seedApprovedLGAWithEndowment(request, ipFor(1));
    const investorEmail = `investor_${uniq()}@example.com`;

    // Navigate to the LGA public profile page
    await page.goto(`/lgas/${slug}`, { waitUntil: "domcontentloaded" });
    await expect(page.locator("h1")).toContainText(/Investville/i, { timeout: 15_000 });

    // Switch to the Investment tab
    await page.getByRole("button", { name: /^Investment$/i }).click();

    // The seeded endowment card should appear
    await expect(page.getByText(/Rich farmland in the valley/i)).toBeVisible({ timeout: 10_000 });

    // Click "Express Interest" on that endowment
    await page.getByRole("button", { name: /express interest/i }).first().click();

    // The modal should open
    await expect(page.getByText(/Express Investment Interest/i)).toBeVisible({ timeout: 5_000 });

    // Fill the inquiry form
    await page.fill("input[placeholder='Full name or company']", "Alpha Capital Partners");
    await page.fill("input[type='email']", investorEmail);
    await page.fill("textarea", "We are interested in large-scale agriculture in this region. Please send details on available parcels and any public-private partnership structures.");

    // Submit the inquiry
    await page.getByRole("button", { name: /send inquiry/i }).click();

    // The modal should advance to the success state
    await expect(page.getByText(/inquiry sent/i)).toBeVisible({ timeout: 15_000 });

    // Confirm the inquiry was persisted in the DB
    await expect.poll(() => inquiryCount(lgaId, investorEmail), { timeout: 10_000 }).toBe(1);
  });
});
