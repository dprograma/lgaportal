/**
 * API contract tests for PAYMENTS & ADVERTISING.
 *
 * Third-party is exercised SANDBOX-ONLY — no live Paystack/Resend calls:
 *   - The Paystack webhook's HMAC-SHA512 signature verification is driven with
 *     a locally-computed signature using the test PAYSTACK_SECRET_KEY, so the
 *     real verifyWebhookSignature logic is tested without hitting Paystack.
 *   - Payment/advertiser mutation endpoints are checked at the auth boundary.
 *
 * Run with:  npx playwright test --project=api payments-e2e
 */

import { test, expect, request as apiRequest, type APIRequestContext } from "@playwright/test";
import { createHmac } from "crypto";
import { Pool } from "pg";
import { config } from "dotenv";

config({ path: ".env.local" });

const BASE = "http://localhost:3000";
const PASSWORD = "Secure@123";
const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY ?? "";
const uniq = () => `${Date.now()}${Math.floor(Math.random() * 1000)}`;

// Own subnet (198.26.x) so buckets never overlap with other suites.
const RUN_OCTET = Math.floor(Math.random() * 254) + 1;
const ipFor = (role: number) => `198.26.${RUN_OCTET}.${role}`;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
test.afterAll(async () => { await pool.end(); });

async function ctx() {
  return apiRequest.newContext({ baseURL: BASE });
}

function sign(body: string): string {
  return createHmac("sha512", PAYSTACK_SECRET).update(body).digest("hex");
}

async function chairmanToken(email: string): Promise<string> {
  const { rows } = await pool.query(
    `SELECT vt.token FROM lga_verification_tokens vt
       JOIN lga_chairmen c ON c.id = vt."chairmanId"
      WHERE c.email = $1 ORDER BY vt."createdAt" DESC LIMIT 1`,
    [email]
  );
  return rows[0]?.token ?? "";
}

async function otpCode(identifier: string, purpose: string): Promise<string> {
  const { rows } = await pool.query(
    `SELECT code FROM otp_codes
      WHERE identifier = $1 AND purpose = $2 AND "usedAt" IS NULL
      ORDER BY "createdAt" DESC LIMIT 1`,
    [identifier.toLowerCase(), purpose]
  );
  return rows[0]?.code ?? "";
}

/** Register + verify + OTP-login an LGA chairman; returns an authed ctx + lgaId. */
async function authedLGA(ip: string): Promise<{ ctx: APIRequestContext; lgaId: string }> {
  const suffix = uniq();
  const email = `chairman_pay_${suffix}@example.com`;
  const c = await apiRequest.newContext({ baseURL: BASE, extraHTTPHeaders: { "x-forwarded-for": ip } });

  const reg = await c.post("/api/lga/register", {
    data: {
      lgaName: `Payville ${suffix}`, state: "Lagos", chairmanName: "Chief Pay",
      email, phone: "08012345678", officeAddress: "1 Pay Road, Ikeja",
      sectors: ["Health"], password: PASSWORD, confirmPassword: PASSWORD, terms: true,
    },
  });
  expect(reg.status(), "seed: LGA register").toBe(201);
  const { lgaId } = await reg.json();

  const ver = await c.post("/api/lga/verify", { data: { token: await chairmanToken(email) } });
  expect(ver.status(), "seed: LGA verify").toBe(200);

  const login = await c.post("/api/lga/login", { data: { email, password: PASSWORD } });
  expect(login.status(), "seed: LGA login").toBe(200);

  await c.post("/api/otp/send", { data: { identifier: email, purpose: "LGA_LOGIN" } });
  const verify = await c.post("/api/otp/verify", {
    data: { identifier: email, code: await otpCode(email, "LGA_LOGIN"), purpose: "LGA_LOGIN" },
  });
  expect(verify.status(), "seed: OTP verify → session cookie").toBe(200);

  return { ctx: c, lgaId };
}

// ─── Paystack webhook — signature verification (sandbox-only) ─────────────────

test.describe("Paystack webhook — signature verification", () => {
  const body = JSON.stringify({
    event: "charge.success",
    data: { reference: `unknown-ref-${Date.now()}`, paid_at: "2026-01-01T00:00:00Z" },
  });

  test("a request with no signature → 401", async () => {
    const c = await ctx();
    const res = await c.post("/api/webhooks/paystack", {
      headers: { "Content-Type": "application/json" },
      data: body,
    });
    expect(res.status()).toBe(401);
  });

  test("a wrong signature → 401", async () => {
    const c = await ctx();
    const res = await c.post("/api/webhooks/paystack", {
      headers: { "Content-Type": "application/json", "x-paystack-signature": "deadbeef" },
      data: body,
    });
    expect(res.status()).toBe(401);
  });

  test("a valid signature is accepted → 200 (unknown reference is a no-op)", async () => {
    test.skip(!PAYSTACK_SECRET, "PAYSTACK_SECRET_KEY not set");
    const c = await ctx();
    const res = await c.post("/api/webhooks/paystack", {
      headers: { "Content-Type": "application/json", "x-paystack-signature": sign(body) },
      data: body,
    });
    expect(res.status()).toBe(200);
  });

  test("a valid signature over a non-JSON body → 400", async () => {
    test.skip(!PAYSTACK_SECRET, "PAYSTACK_SECRET_KEY not set");
    const bad = "this is not json";
    const c = await ctx();
    const res = await c.post("/api/webhooks/paystack", {
      headers: { "Content-Type": "text/plain", "x-paystack-signature": sign(bad) },
      data: bad,
    });
    expect(res.status()).toBe(400);
  });
});

// ─── Payment & advertiser endpoints — auth boundary ──────────────────────────

test.describe("Payments & advertiser — auth boundary", () => {
  test("POST /api/paystack/initialize without a session → 401", async () => {
    const c = await ctx();
    const res = await c.post("/api/paystack/initialize", {
      headers: { "Content-Type": "application/json" },
      data: {},
    });
    expect(res.status()).toBe(401);
  });

  test("GET /api/paystack/verify without a session/ref → 401", async () => {
    const c = await ctx();
    expect((await c.get("/api/paystack/verify")).status()).toBe(401);
  });

  test("GET /api/advertiser/campaigns without a session → 403", async () => {
    const c = await ctx();
    expect((await c.get("/api/advertiser/campaigns")).status()).toBe(403);
  });

  test("POST /api/advertiser/campaigns without a session → 403", async () => {
    const c = await ctx();
    const res = await c.post("/api/advertiser/campaigns", {
      headers: { "Content-Type": "application/json" },
      data: {},
    });
    expect(res.status()).toBe(403);
  });
});

// ─── /api/transactions — LGA-scoped history must be owner-checked ────────────
// Previously `type=lga&lgaId=X` trusted the client-supplied lgaId outright
// with no session check at all — any logged-in citizen could read any LGA's
// payment history just by guessing its id. It's now authorised against the
// chairman's own signed lga_session cookie, matching every other
// LGA-dashboard-scoped endpoint.

test.describe("GET /api/transactions", () => {
  test("type=user without a citizen session → 401", async () => {
    const c = await ctx();
    const res = await c.get("/api/transactions");
    expect(res.status()).toBe(401);
  });

  test("type=lga without any session → 401", async () => {
    const c = await ctx();
    const res = await c.get("/api/transactions?type=lga&lgaId=some-id");
    expect(res.status()).toBe(401);
  });

  test("type=lga with no lgaId, even with a valid chairman session → 401", async () => {
    const { ctx: lgaCtx } = await authedLGA(ipFor(1));
    const res = await lgaCtx.get("/api/transactions?type=lga");
    expect(res.status()).toBe(401);
  });

  test("a chairman can read their own LGA's transaction history → 200", async () => {
    const { ctx: lgaCtx, lgaId } = await authedLGA(ipFor(2));
    const res = await lgaCtx.get(`/api/transactions?type=lga&lgaId=${lgaId}`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.transactions)).toBe(true);
  });

  test("a chairman cannot read another LGA's transaction history → 401", async () => {
    const { lgaId: victimLgaId } = await authedLGA(ipFor(3));
    const { ctx: attackerCtx } = await authedLGA(ipFor(4));
    const res = await attackerCtx.get(`/api/transactions?type=lga&lgaId=${victimLgaId}`);
    expect(res.status()).toBe(401);
  });
});

// ─── Public ad serving ───────────────────────────────────────────────────────

test.describe("Ad serving", () => {
  test("GET /api/ads → 200 with an ad slot (may be null)", async () => {
    const c = await ctx();
    const res = await c.get("/api/ads");
    expect(res.status()).toBe(200);
    expect("ad" in (await res.json())).toBe(true);
  });

  test("GET /api/ads/[id]/click is not allowed (POST only) → 405", async () => {
    const c = await ctx();
    expect((await c.get("/api/ads/some-id/click")).status()).toBe(405);
  });
});
