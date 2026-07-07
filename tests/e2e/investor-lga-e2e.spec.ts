/**
 * End-to-end integration tests for the INVESTOR ↔ LGA chairman interaction.
 *
 * The story, exercised over real HTTP against the real database:
 *
 *   1. An LGA chairman (authenticated) publishes a resource ENDOWMENT on its
 *      own page — the investment opportunity investors browse.
 *   2. That endowment is publicly listed.
 *   3. An investor registers, then submits an INQUIRY about the LGA/endowment.
 *   4. The chairman sees the inquiry (with investor contact details) in its
 *      dashboard — and cannot see another LGA's inquiries.
 *
 * Authorization model exercised:
 *   - Publishing/editing/deleting endowments requires the LGA session (lgaId
 *     pinned to the session; cross-LGA writes 404).
 *   - Reading investor inquiries requires the LGA session and is scoped to the
 *     session's own lgaId — the investor PII is never exposed by query string.
 *   - Investors have no login, so submitting an inquiry is public (but the
 *     investor and LGA must exist).
 *
 * Run with:  npx playwright test --project=api investor-lga-e2e
 */

import { test, expect, request as apiRequest, type APIRequestContext } from "@playwright/test";
import { Pool } from "pg";
import { config } from "dotenv";

config({ path: ".env.local" });

const BASE = "http://localhost:3000";
const PASSWORD = "Secure@123";
const uniq = () => `${Date.now()}${Math.floor(Math.random() * 1000)}`;

// Own subnet (198.20.x) so rate-limit buckets don't overlap with sibling specs.
const RUN_OCTET = Math.floor(Math.random() * 254) + 1;
const ipFor = (role: number) => `198.20.${RUN_OCTET}.${role}`;

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

async function otpCode(identifier: string, purpose: string): Promise<string> {
  const { rows } = await pool.query(
    `SELECT code FROM otp_codes
      WHERE identifier = $1 AND purpose = $2 AND "usedAt" IS NULL
      ORDER BY "createdAt" DESC LIMIT 1`,
    [identifier.toLowerCase(), purpose]
  );
  return rows[0]?.code ?? "";
}

async function ctxForIp(ip: string): Promise<APIRequestContext> {
  return apiRequest.newContext({ baseURL: BASE, extraHTTPHeaders: { "x-forwarded-for": ip } });
}

/** Register + verify an LGA and complete login → OTP so ctx holds the session cookie. */
async function authedLGA(ip: string): Promise<{ ctx: APIRequestContext; lgaId: string; email: string }> {
  const suffix = uniq();
  const email = `chairman_${suffix}@example.com`;
  const ctx = await ctxForIp(ip);

  const reg = await ctx.post("/api/lga/register", {
    data: {
      lgaName: `Endowville ${suffix}`, state: "Lagos", chairmanName: "Chief Invest",
      email, phone: "08012345678", officeAddress: "1 Council Road, Ikeja",
      sectors: ["Agriculture"], password: PASSWORD, confirmPassword: PASSWORD, terms: true,
    },
  });
  expect(reg.status(), "LGA registration").toBe(201);
  const { lgaId } = await reg.json();

  const ver = await ctx.post("/api/lga/verify", { data: { token: await chairmanToken(email) } });
  expect(ver.status(), "LGA email verification").toBe(200);

  expect((await ctx.post("/api/lga/login", { data: { email, password: PASSWORD } })).status(), "LGA login").toBe(200);
  expect((await ctx.post("/api/otp/send", { data: { identifier: email, purpose: "LGA_LOGIN" } })).status()).toBe(200);
  const verify = await ctx.post("/api/otp/verify", {
    data: { identifier: email, code: await otpCode(email, "LGA_LOGIN"), purpose: "LGA_LOGIN" },
  });
  expect(verify.status(), "OTP verify → session cookie").toBe(200);

  return { ctx, lgaId, email };
}

/** Publish an endowment as the authenticated LGA. */
async function publishEndowment(ctx: APIRequestContext): Promise<string> {
  const res = await ctx.post("/api/lgas/endowments", {
    data: {
      category: "AGRICULTURE",
      title: "Fertile lowland rice belt",
      description: "10,000 hectares of irrigated lowland suitable for large-scale rice production.",
      highlights: ["Year-round irrigation", "Existing access roads", "Tax incentives"],
      investmentRange: "$1M – $10M",
      isPublished: true,
    },
  });
  expect(res.status(), "endowment publish").toBe(201);
  return (await res.json()).endowment.id;
}

/** Register a fresh investor; returns the investorId. */
async function registerInvestor(): Promise<{ investorId: string; email: string }> {
  const ctx = await apiRequest.newContext({ baseURL: BASE });
  const email = `investor_${uniq()}@example.com`;
  const res = await ctx.post("/api/investors/register", {
    data: {
      fullName: "Global Agri Capital", email, phone: "08012345678", company: "Global Agri Capital",
      country: "Nigeria", sectors: ["AGRICULTURE"], minBudget: "1000000", maxBudget: "10000000",
    },
  });
  expect(res.status(), "investor registration").toBe(201);
  return { investorId: (await res.json()).investorId, email };
}

// ─────────────────────────────────────────────────────────────────────────────

test.describe("Investor ↔ LGA chairman — endowments & inquiries", () => {
  let lga: { ctx: APIRequestContext; lgaId: string; email: string };
  let endowmentId: string;
  let investor: { investorId: string; email: string };

  test.beforeAll(async () => {
    lga = await authedLGA(ipFor(1));
    endowmentId = await publishEndowment(lga.ctx);
    investor = await registerInvestor();
  });

  // ── Endowment publishing & visibility ────────────────────────────────────
  test("publishing an endowment without a session → 401", async () => {
    const anon = await apiRequest.newContext({ baseURL: BASE });
    const res = await anon.post("/api/lgas/endowments", {
      data: {
        category: "AGRICULTURE", title: "Rogue endowment",
        description: "Should never be created without a session.", highlights: ["x"],
      },
    });
    expect(res.status()).toBe(401);
  });

  test("the published endowment is publicly listed for the LGA", async () => {
    const anon = await apiRequest.newContext({ baseURL: BASE });
    const res = await anon.get(`/api/lgas/endowments?lgaId=${lga.lgaId}`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    const mine = body.endowments.find((e: { id: string }) => e.id === endowmentId);
    expect(mine, "the endowment appears in the public listing").toBeTruthy();
  });

  test("publishing pins the endowment to the session's LGA", async () => {
    // Endowment created in beforeAll must belong to this LGA.
    const { rows } = await pool.query(`SELECT "lgaId" FROM lga_endowments WHERE id = $1`, [endowmentId]);
    expect(rows[0]?.lgaId).toBe(lga.lgaId);
  });

  // ── Investor inquiry ─────────────────────────────────────────────────────
  test("an investor can submit an inquiry about the LGA's endowment → 201", async () => {
    const anon = await apiRequest.newContext({ baseURL: BASE });
    const res = await anon.post("/api/investors/inquiries", {
      data: {
        investorId: investor.investorId,
        lgaId: lga.lgaId,
        endowmentId,
        message: "We are interested in the rice belt opportunity and would like to discuss terms.",
      },
    });
    expect(res.status()).toBe(201);
    expect((await res.json()).inquiryId).toBeTruthy();
  });

  test("inquiry with an unknown investor → 404", async () => {
    const anon = await apiRequest.newContext({ baseURL: BASE });
    const res = await anon.post("/api/investors/inquiries", {
      data: { investorId: "cl00000000000000000000000", lgaId: lga.lgaId, message: "Unknown investor inquiry attempt." },
    });
    expect([404, 422]).toContain(res.status());
  });

  test("inquiry with too-short message → 422", async () => {
    const anon = await apiRequest.newContext({ baseURL: BASE });
    const res = await anon.post("/api/investors/inquiries", {
      data: { investorId: investor.investorId, lgaId: lga.lgaId, message: "too short" },
    });
    expect(res.status()).toBe(422);
  });

  // ── Chairman reads inquiries (session-scoped) ────────────────────────────
  test("reading inquiries without a session → 401", async () => {
    const anon = await apiRequest.newContext({ baseURL: BASE });
    expect((await anon.get("/api/investors/inquiries")).status()).toBe(401);
  });

  test("a spoofed lgaId query without a session is rejected → 401", async () => {
    const anon = await apiRequest.newContext({ baseURL: BASE });
    const res = await anon.get(`/api/investors/inquiries?lgaId=${lga.lgaId}`);
    expect(res.status()).toBe(401);
  });

  test("the chairman sees the investor's inquiry with contact details", async () => {
    const res = await lga.ctx.get("/api/investors/inquiries");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.inquiries)).toBe(true);
    const mine = body.inquiries.find(
      (i: { investor?: { email?: string } }) => i.investor?.email === investor.email
    );
    expect(mine, "the submitted inquiry is visible to the owning LGA").toBeTruthy();
    expect(mine.message).toContain("rice belt");
    expect(mine.investor.fullName).toBe("Global Agri Capital");
  });

  test("another LGA cannot see this LGA's inquiries (session-scoped)", async () => {
    const other = await authedLGA(ipFor(2));
    const res = await other.ctx.get("/api/investors/inquiries");
    expect(res.status()).toBe(200);
    const body = await res.json();
    const leaked = body.inquiries.find(
      (i: { investor?: { email?: string } }) => i.investor?.email === investor.email
    );
    expect(leaked, "another LGA must not see this LGA's inquiries").toBeFalsy();
  });
});

test.describe("Investor ↔ LGA chairman — endowment ownership", () => {
  let lgaA: { ctx: APIRequestContext; lgaId: string };
  let lgaB: { ctx: APIRequestContext; lgaId: string };
  let endowmentA: string;

  test.beforeAll(async () => {
    lgaA = await authedLGA(ipFor(3));
    lgaB = await authedLGA(ipFor(4));
    endowmentA = await publishEndowment(lgaA.ctx);
  });

  test("the owner can update its own endowment → 200", async () => {
    const res = await lgaA.ctx.put("/api/lgas/endowments", {
      data: { id: endowmentA, title: "Fertile lowland rice belt (updated)" },
    });
    expect(res.status()).toBe(200);
  });

  test("another LGA cannot update someone else's endowment → 404", async () => {
    const res = await lgaB.ctx.put("/api/lgas/endowments", {
      data: { id: endowmentA, title: "Hijacked endowment" },
    });
    expect(res.status()).toBe(404);
  });

  test("another LGA cannot delete someone else's endowment → 404", async () => {
    const res = await lgaB.ctx.delete(`/api/lgas/endowments?id=${endowmentA}`);
    expect(res.status()).toBe(404);
  });

  test("the owner can delete its own endowment → 200", async () => {
    const res = await lgaA.ctx.delete(`/api/lgas/endowments?id=${endowmentA}`);
    expect(res.status()).toBe(200);
  });
});
