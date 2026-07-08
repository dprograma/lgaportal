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

import { test, expect, request as apiRequest } from "@playwright/test";
import { createHmac } from "crypto";
import { config } from "dotenv";

config({ path: ".env.local" });

const BASE = "http://localhost:3000";
const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY ?? "";

async function ctx() {
  return apiRequest.newContext({ baseURL: BASE });
}

function sign(body: string): string {
  return createHmac("sha512", PAYSTACK_SECRET).update(body).digest("hex");
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
