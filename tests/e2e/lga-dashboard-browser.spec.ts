/**
 * Browser E2E for the complete LGA CHAIRMAN dashboard journey:
 *
 *   lga-login → OTP (2FA) → dashboard → publish post → add endowment →
 *   submit press release → sign out.
 *
 * A verified LGA/chairman is seeded over the API (bypasses registration rate
 * limits), OTP codes are seeded directly in the DB for determinism, and all
 * write operations are confirmed in the database.
 *
 * Run with:  npx playwright test --project=chromium lga-dashboard-browser
 */

import { test, expect, request as apiRequest, type APIRequestContext, type Page } from "@playwright/test";
import { Pool } from "pg";
import { config } from "dotenv";

config({ path: ".env.local" });

const PASSWORD = "Secure@123";
const uniq = () => `${Date.now()}${Math.floor(Math.random() * 1000)}`;

const RUN_OCTET = Math.floor(Math.random() * 254) + 1;
const ipFor = (role: number) => `198.23.${RUN_OCTET}.${role}`;

// Each browser login gets a unique IP so they never share the in-memory rate-limit bucket
let _loginCounter = 0;
const nextLoginIp = () => `198.23.${RUN_OCTET}.${200 + _loginCounter++}`;

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
  await pool.query(
    `DELETE FROM otp_codes WHERE identifier = $1 AND purpose = 'LGA_LOGIN'`,
    [email.toLowerCase()]
  );
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

async function endowmentCount(lgaId: string, title: string): Promise<number> {
  const { rows } = await pool.query(
    `SELECT count(*)::int AS n FROM lga_endowments WHERE "lgaId" = $1 AND title = $2`,
    [lgaId, title]
  );
  return rows[0]?.n ?? 0;
}

async function pressReleaseCount(lgaId: string, title: string): Promise<number> {
  const { rows } = await pool.query(
    `SELECT count(*)::int AS n FROM press_releases WHERE "lgaId" = $1 AND title = $2`,
    [lgaId, title]
  );
  return rows[0]?.n ?? 0;
}

async function postIdByTitle(lgaId: string, title: string): Promise<string> {
  const { rows } = await pool.query(
    `SELECT id FROM posts WHERE "lgaId" = $1 AND title = $2 LIMIT 1`,
    [lgaId, title]
  );
  return rows[0]?.id ?? "";
}

async function citizenToken(email: string): Promise<string> {
  const { rows } = await pool.query(
    `SELECT vt.token FROM verification_tokens vt
       JOIN users u ON u.id = vt."userId"
      WHERE u.email = $1 ORDER BY vt."createdAt" DESC LIMIT 1`,
    [email]
  );
  return rows[0]?.token ?? "";
}

/**
 * Register + verify + sign in a citizen over the API, then have them comment
 * on and submit feedback for the given post. Returns the identifying strings
 * so the caller can assert their exact content shows up on the chairman's
 * dashboard.
 */
async function citizenEngages(
  ip: string,
  postId: string,
): Promise<{ name: string; commentContent: string; feedbackMessage: string; feedbackCategory: string }> {
  const suffix = uniq();
  const email = `citizen_${suffix}@example.com`;
  const name = `Concerned Citizen ${suffix}`;
  const ctx = await apiRequest.newContext({ baseURL: "http://localhost:3000", extraHTTPHeaders: { "x-forwarded-for": ip } });

  const reg = await ctx.post("/api/auth/register", {
    data: { name, email, state: "Lagos", lga: "Ikeja", password: PASSWORD, confirmPassword: PASSWORD, terms: true },
  });
  expect(reg.status(), "seed: citizen register").toBe(201);

  const ver = await ctx.post("/api/auth/verify-email", { data: { token: await citizenToken(email) } });
  expect(ver.status(), "seed: citizen verify").toBe(200);

  const { csrfToken } = await (await ctx.get("/api/auth/csrf")).json();
  await ctx.post("/api/auth/callback/credentials", {
    form: { csrfToken, email, password: PASSWORD, redirect: "false", callbackUrl: "http://localhost:3000" },
  });

  const commentContent = `Great to see this progress, from ${name}!`;
  const commentRes = await ctx.post("/api/comments", {
    data: { contentId: postId, contentType: "post", content: commentContent },
  });
  expect(commentRes.status(), "seed: citizen comment").toBe(201);

  const feedbackMessage = `Really appreciated this update — from ${name}.`;
  const feedbackCategory = "Service Delivery";
  const feedbackRes = await ctx.post("/api/feedback", {
    data: { postId, rating: 4, category: feedbackCategory, message: feedbackMessage },
  });
  expect(feedbackRes.status(), "seed: citizen feedback").toBe(201);

  await ctx.dispose();
  return { name, commentContent, feedbackMessage, feedbackCategory };
}

/** Register + verify an LGA over the API; returns the chairman email + lgaId. */
async function seedVerifiedLGA(
  request: APIRequestContext,
  ip: string,
): Promise<{ email: string; lgaId: string }> {
  const suffix = uniq();
  const email  = `chairman_${suffix}@example.com`;
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
  const ver = await request.post("/api/lga/verify", {
    headers: { "x-forwarded-for": ip },
    data: { token: await chairmanToken(email) },
  });
  expect(ver.status(), "seed: LGA verify").toBe(200);
  return { email, lgaId };
}

/**
 * Drive the full login → OTP → dashboard flow and return a page already
 * authenticated and sitting on /lga-dashboard.
 */
async function loginAsChairman(page: Page, email: string, otpCode: string): Promise<void> {
  // Unique IP per call — prevents rate-limit exhaustion on both login and OTP verify
  const loginIp = nextLoginIp();
  const injectIp = async (route: import("@playwright/test").Route) =>
    route.continue({ headers: { ...route.request().headers(), "x-forwarded-for": loginIp } });
  await page.route("**/api/lga/login",  injectIp);
  await page.route("**/api/otp/verify", injectIp);

  await page.goto("/lga-login", { waitUntil: "domcontentloaded" });
  await page.fill("input[name='email']", email);
  await page.fill("input[name='password']", PASSWORD);
  await page.click("button[type='submit']");

  await expect(page).toHaveURL(/verify-otp.*LGA_LOGIN/, { timeout: 15_000 });
  await seedLgaOtp(email, otpCode);
  const boxes = page.locator("input[maxlength='1'][inputmode='numeric']");
  await expect(boxes).toHaveCount(6);
  for (let i = 0; i < 6; i++) await boxes.nth(i).fill(otpCode[i]);

  // Match pathname only: /lga-dashboard or /lga-dashboard/* but NOT verify-otp?...next=/lga-dashboard
  await expect(page).toHaveURL(/\/lga-dashboard(?:$|\/|\?)/, { timeout: 15_000 });
}

test.describe("LGA chairman dashboard journey — browser", () => {

  test("the dashboard redirects to lga-login when not authenticated", async ({ page }) => {
    await page.goto("/lga-dashboard", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/lga-login/, { timeout: 15_000 });
  });

  test("chairman logs in, passes OTP, and reaches the dashboard", async ({ page, request }) => {
    const { email } = await seedVerifiedLGA(request, ipFor(1));
    await loginAsChairman(page, email, "111222");
    await expect(page.locator("body")).toContainText(/dashboard|overview|welcome/i, { timeout: 10_000 });
  });

  test("chairman publishes a post via the dashboard UI", async ({ page, request }) => {
    const { email, lgaId } = await seedVerifiedLGA(request, ipFor(2));
    await loginAsChairman(page, email, "222333");

    await page.goto("/lga-dashboard/posts", { waitUntil: "domcontentloaded" });
    await page.getByRole("button", { name: /new post|create post/i }).first().click();

    const title = `Ward briefing ${uniq()}`;
    await page.fill("input[placeholder='Post title…']", title);
    await page.fill("textarea[placeholder='Write your post content here…']", "An official update published via the dashboard UI during an E2E test.");
    await page.getByRole("button", { name: /publish post/i }).click();

    await expect(page.getByText(/post published successfully/i)).toBeVisible({ timeout: 15_000 });
    await expect.poll(() => postCount(lgaId, title), { timeout: 10_000 }).toBe(1);

    // The write path succeeding isn't enough — confirm the dashboard's own list
    // re-fetch actually shows it (this regressed silently: posts/page.tsx read
    // its lgaId from localStorage, which nothing ever wrote to, so the fetch
    // guard `if (!lgaId) return` skipped every load and the spinner never
    // resolved, even though publishing itself worked via the session cookie).
    await expect(page.locator(".animate-spin")).toHaveCount(0, { timeout: 10_000 });
    await expect(page.getByText(title)).toBeVisible({ timeout: 10_000 });
  });

  test("a DRAFT post appears in the chairman's own list and updates the draft count", async ({ page, request }) => {
    const { email, lgaId } = await seedVerifiedLGA(request, ipFor(7));
    await loginAsChairman(page, email, "777888");

    await page.goto("/lga-dashboard/posts", { waitUntil: "domcontentloaded" });
    await expect(page.locator(".animate-spin")).toHaveCount(0, { timeout: 10_000 });

    await page.getByRole("button", { name: /new post|create post/i }).first().click();
    const title = `Draft briefing ${uniq()}`;
    await page.fill("input[placeholder='Post title…']", title);
    await page.fill("textarea[placeholder='Write your post content here…']", "A draft that should be visible only to its own LGA.");
    await page.locator("label", { hasText: /^Draft$/i }).click();
    await page.getByRole("button", { name: /publish post|save draft/i }).click();

    await expect(page.getByText(/post published successfully|draft saved/i)).toBeVisible({ timeout: 15_000 });
    await expect.poll(() => postCount(lgaId, title), { timeout: 10_000 }).toBe(1);

    await expect(page.getByText(title)).toBeVisible({ timeout: 10_000 });
    const draftStat = page.locator("p", { hasText: /^Draft$/ }).locator("..").locator("p").first();
    await expect(draftStat).toHaveText(/[1-9]\d*/, { timeout: 10_000 });
  });

  test("chairman adds an endowment listing via the dashboard UI", async ({ page, request }) => {
    const { email, lgaId } = await seedVerifiedLGA(request, ipFor(3));
    await loginAsChairman(page, email, "333444");

    await page.goto("/lga-dashboard/endowments", { waitUntil: "domcontentloaded" });
    await page.getByRole("button", { name: /add endowment/i }).first().click();

    // Pick a category (grid of toggle buttons — click "Agriculture")
    await page.getByRole("button", { name: /^Agriculture$/i }).click();

    const endTitle = `Coal seam deposit ${uniq()}`;
    await page.fill("input[placeholder*='Coal']", endTitle);
    await page.fill("textarea[placeholder*='Describe this']", "Extensive bituminous coal seams with high energy output, suitable for industrial-scale extraction.");
    await page.fill("textarea[placeholder*='Extensive coal']", "Commercially viable reserves\nProximity to rail network\nEstimated 50-year yield");

    // Submit (the toggle defaults to isPublished=true)
    await page.getByRole("button", { name: /publish endowment/i }).click();

    await expect(page.getByText("Endowment published.")).toBeVisible({ timeout: 15_000 });
    await expect.poll(() => endowmentCount(lgaId, endTitle), { timeout: 10_000 }).toBe(1);
  });

  test("chairman submits a press release for admin review", async ({ page, request }) => {
    const { email, lgaId } = await seedVerifiedLGA(request, ipFor(4));
    await loginAsChairman(page, email, "444555");

    await page.goto("/lga-dashboard/press-releases", { waitUntil: "domcontentloaded" });
    await page.getByRole("button", { name: /new release/i }).click();

    const prTitle = `Council budget statement ${uniq()}`;
    await page.fill("input[placeholder='Press release headline…']", prTitle);
    // Date Issued: native date input — fill with today's date
    const today = new Date().toISOString().split("T")[0];
    await page.locator("input[type='date']").fill(today);
    await page.fill("textarea[placeholder*='full text']", "The council has approved the annual budget for the upcoming fiscal year, prioritising infrastructure and healthcare.");

    await page.getByRole("button", { name: /submit for review/i }).click();

    await expect(page.getByText(/press release submitted for admin review/i)).toBeVisible({ timeout: 15_000 });
    await expect.poll(() => pressReleaseCount(lgaId, prTitle), { timeout: 10_000 }).toBe(1);
  });

  test("chairman can read a citizen's comment and feedback via the engagement modal", async ({ page, request }) => {
    const { email, lgaId } = await seedVerifiedLGA(request, ipFor(6));
    await loginAsChairman(page, email, "666777");

    await page.goto("/lga-dashboard/posts", { waitUntil: "domcontentloaded" });
    await page.getByRole("button", { name: /new post|create post/i }).first().click();

    const title = `Engagement briefing ${uniq()}`;
    await page.fill("input[placeholder='Post title…']", title);
    await page.fill("textarea[placeholder='Write your post content here…']", "A post used to verify the chairman can read citizen comments and feedback.");
    await page.getByRole("button", { name: /publish post/i }).click();
    await expect(page.getByText(/post published successfully/i)).toBeVisible({ timeout: 15_000 });
    await expect(page.locator(".animate-spin")).toHaveCount(0, { timeout: 10_000 });

    const postId = await postIdByTitle(lgaId, title);
    expect(postId, "seed: created post id").toBeTruthy();

    // A citizen comments on and submits feedback for the post — the bug report
    // was that neither was ever readable from the chairman's dashboard, only
    // a bare comment count.
    const engagement = await citizenEngages(ipFor(8), postId);

    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(page.locator(".animate-spin")).toHaveCount(0, { timeout: 10_000 });

    // This is the LGA's only post, so the single "view" button unambiguously
    // belongs to it — the same click path an LGA chairman uses in production.
    await page.locator('button:has-text("view")').first().click();

    await expect(page.getByText(/^Comments \(/)).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(engagement.commentContent)).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(engagement.name).first()).toBeVisible();

    await page.getByText(/^Feedback \(/).click();
    await expect(page.getByText(engagement.feedbackMessage)).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(engagement.feedbackCategory)).toBeVisible();
  });

  test("chairman signs out and is redirected to lga-login", async ({ page, request }) => {
    const { email } = await seedVerifiedLGA(request, ipFor(5));
    await loginAsChairman(page, email, "555666");

    // The Sign Out button is in the sidebar (desktop layout)
    await page.getByRole("button", { name: /sign out/i }).click();

    await expect(page).toHaveURL(/\/lga-login/, { timeout: 15_000 });
  });

});
