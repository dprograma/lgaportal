/**
 * End-to-end tests for the LGA portal's verifiable session and post ownership.
 *
 * LGA chairmen used to be "authorized" by an `x-lga-id` request header that the
 * client set from sessionStorage — trivially spoofable, so anyone could act as
 * any LGA. This suite pins down the hardened model:
 *
 *   - A signed, HttpOnly `lga_session` cookie is minted at OTP verification.
 *   - Every LGA-scoped route requires that verified cookie; the header alone is
 *     no longer trusted.
 *   - Publishing pins the post's lgaId to the session — the request body cannot
 *     override which LGA a post belongs to.
 *   - An LGA can only edit/delete its OWN posts (cross-LGA writes 404).
 *   - Logout clears the cookie.
 *
 * Run with:  npx playwright test --project=api lga-portal-auth-e2e
 */

import { test, expect, request as apiRequest, type APIRequestContext } from "@playwright/test";
import { Pool } from "pg";
import { config } from "dotenv";

config({ path: ".env.local" });

const BASE = "http://localhost:3000";
const PASSWORD = "Secure@123";
const uniq = () => `${Date.now()}${Math.floor(Math.random() * 1000)}`;

// Own subnet (198.19.x) so rate-limit buckets don't overlap with sibling specs.
const RUN_OCTET = Math.floor(Math.random() * 254) + 1;
const ipFor = (role: number) => `198.19.${RUN_OCTET}.${role}`;

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
      lgaName: `Portalville ${suffix}`, state: "Lagos", chairmanName: "Chief Portal",
      email, phone: "08012345678", officeAddress: "1 Council Road, Ikeja",
      sectors: ["Health"], password: PASSWORD, confirmPassword: PASSWORD, terms: true,
    },
  });
  expect(reg.status(), "LGA registration").toBe(201);
  const { lgaId } = await reg.json();

  const ver = await ctx.post("/api/lga/verify", { data: { token: await chairmanToken(email) } });
  expect(ver.status(), "LGA email verification").toBe(200);

  const login = await ctx.post("/api/lga/login", { data: { email, password: PASSWORD } });
  expect(login.status(), "LGA login").toBe(200);

  const send = await ctx.post("/api/otp/send", { data: { identifier: email, purpose: "LGA_LOGIN" } });
  expect(send.status(), "OTP send").toBe(200);

  const verify = await ctx.post("/api/otp/verify", {
    data: { identifier: email, code: await otpCode(email, "LGA_LOGIN"), purpose: "LGA_LOGIN" },
  });
  expect(verify.status(), "OTP verify → session cookie").toBe(200);

  return { ctx, lgaId, email };
}

async function publishPost(ctx: APIRequestContext, title = "Official council update"): Promise<string> {
  const res = await ctx.post("/api/posts", {
    data: { title, content: "Content for an official LGA portal update.", status: "PUBLISHED" },
  });
  expect(res.status(), "post publish").toBe(201);
  return (await res.json()).post.id;
}

/** The chairman creates a staff member (delegated publisher). */
async function createStaff(chairmanCtx: APIRequestContext, canPublish: boolean): Promise<{ email: string; password: string }> {
  const email = `staff_${uniq()}@example.com`;
  const password = "Staff@1234";
  const res = await chairmanCtx.post("/api/lga-dashboard/staff", {
    data: { name: "Delegate Staff", email, phone: "08012345678", role: "STAFF", canPublish, password },
  });
  expect(res.status(), "create staff").toBe(201);
  return { email, password };
}

/** Log a staff member in through login → OTP; returns a ctx with the session cookie. */
async function authedStaff(ip: string, email: string, password: string): Promise<APIRequestContext> {
  const ctx = await ctxForIp(ip);
  expect((await ctx.post("/api/lga/login", { data: { email, password } })).status(), "staff login").toBe(200);
  expect((await ctx.post("/api/otp/send", { data: { identifier: email, purpose: "LGA_LOGIN" } })).status()).toBe(200);
  const verify = await ctx.post("/api/otp/verify", {
    data: { identifier: email, code: await otpCode(email, "LGA_LOGIN"), purpose: "LGA_LOGIN" },
  });
  expect(verify.status(), "staff OTP verify → session cookie").toBe(200);
  return ctx;
}

// ─────────────────────────────────────────────────────────────────────────────

test.describe("LGA portal — verifiable session", () => {
  let lga: { ctx: APIRequestContext; lgaId: string; email: string };

  test.beforeAll(async () => {
    lga = await authedLGA(ipFor(1));
  });

  test("OTP verification issues a session that unlocks the dashboard", async () => {
    const res = await lga.ctx.get("/api/lga-dashboard/overview");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.id ?? body.lga?.id ?? body.overview?.id ?? lga.lgaId).toBeTruthy();
  });

  test("the dashboard rejects a request with no session cookie → 401", async () => {
    const anon = await apiRequest.newContext({ baseURL: BASE });
    expect((await anon.get("/api/lga-dashboard/overview")).status()).toBe(401);
  });

  test("a spoofed x-lga-id header with no cookie is NOT trusted → 401", async () => {
    const anon = await apiRequest.newContext({ baseURL: BASE });
    const res = await anon.get("/api/lga-dashboard/overview", { headers: { "x-lga-id": lga.lgaId } });
    expect(res.status()).toBe(401);
  });

  test("publishing without a session → 401", async () => {
    const anon = await apiRequest.newContext({ baseURL: BASE });
    const res = await anon.post("/api/posts", {
      data: { title: "Rogue post", content: "Should never be created.", status: "PUBLISHED" },
    });
    expect(res.status()).toBe(401);
  });

  test("publishing pins the post to the session's LGA, ignoring a body lgaId", async () => {
    const res = await lga.ctx.post("/api/posts", {
      data: {
        lgaId: "some-other-lga-id", // attacker-supplied — must be ignored
        title: "Pinned to my own LGA",
        content: "The lgaId in this body should be ignored by the server.",
        status: "PUBLISHED",
      },
    });
    expect(res.status()).toBe(201);
    expect((await res.json()).post.lgaId).toBe(lga.lgaId);
  });

  test("a DRAFT post is visible to its own LGA dashboard but hidden from public visitors", async () => {
    const create = await lga.ctx.post("/api/posts", {
      data: { title: "Unpublished draft", content: "Not ready for citizens to see yet.", status: "DRAFT" },
    });
    expect(create.status()).toBe(201);

    const ownerView = await lga.ctx.get(`/api/posts?lgaId=${lga.lgaId}&limit=50`);
    expect(ownerView.status()).toBe(200);
    const ownerBody = await ownerView.json();
    expect(ownerBody.posts.some((p: { status: string }) => p.status === "DRAFT")).toBe(true);

    const anon = await apiRequest.newContext({ baseURL: BASE });
    const publicView = await anon.get(`/api/posts?lgaId=${lga.lgaId}&limit=50`);
    expect(publicView.status()).toBe(200);
    const publicBody = await publicView.json();
    expect(publicBody.posts.some((p: { status: string }) => p.status === "DRAFT")).toBe(false);
  });

  test("logout clears the cookie and re-gates the dashboard", async () => {
    const fresh = await authedLGA(ipFor(2));
    expect((await fresh.ctx.get("/api/lga-dashboard/overview")).status()).toBe(200);

    const out = await fresh.ctx.post("/api/lga/logout");
    expect(out.status()).toBe(200);

    expect((await fresh.ctx.get("/api/lga-dashboard/overview")).status()).toBe(401);
  });
});

test.describe("LGA portal — cross-LGA post ownership", () => {
  let lgaA: { ctx: APIRequestContext; lgaId: string };
  let lgaB: { ctx: APIRequestContext; lgaId: string };
  let postA: string;

  test.beforeAll(async () => {
    lgaA = await authedLGA(ipFor(3));
    lgaB = await authedLGA(ipFor(4));
    postA = await publishPost(lgaA.ctx);
  });

  test("an LGA can edit its own post → 200", async () => {
    const res = await lgaA.ctx.put(`/api/posts/${postA}`, { data: { title: "Edited by owner" } });
    expect(res.status()).toBe(200);
  });

  test("another LGA cannot edit someone else's post → 404", async () => {
    const res = await lgaB.ctx.put(`/api/posts/${postA}`, { data: { title: "Hijacked" } });
    expect(res.status()).toBe(404);
  });

  test("another LGA cannot delete someone else's post → 404", async () => {
    const res = await lgaB.ctx.delete(`/api/posts/${postA}`);
    expect(res.status()).toBe(404);
  });

  test("the owner can delete its own post → 200", async () => {
    const res = await lgaA.ctx.delete(`/api/posts/${postA}`);
    expect(res.status()).toBe(200);
  });
});

test.describe("LGA portal — staff roles (canPublish)", () => {
  let chairman: { ctx: APIRequestContext; lgaId: string };
  let publisherCtx: APIRequestContext; // staff with canPublish = true
  let viewerCtx: APIRequestContext;    // staff with canPublish = false

  test.beforeAll(async () => {
    chairman = await authedLGA(ipFor(5));
    const pub = await createStaff(chairman.ctx, true);
    const viewer = await createStaff(chairman.ctx, false);
    publisherCtx = await authedStaff(ipFor(6), pub.email, pub.password);
    viewerCtx = await authedStaff(ipFor(7), viewer.email, viewer.password);
  });

  test("a staff member with canPublish can publish a post → 201", async () => {
    const res = await publisherCtx.post("/api/posts", {
      data: { title: "Staff-published update", content: "Posted by a delegated staff member.", status: "PUBLISHED" },
    });
    expect(res.status()).toBe(201);
    // The post is attributed to the staff member's LGA.
    expect((await res.json()).post.lgaId).toBe(chairman.lgaId);
  });

  test("a staff member without canPublish cannot publish → 403", async () => {
    const res = await viewerCtx.post("/api/posts", {
      data: { title: "Should be blocked", content: "This staff member cannot publish.", status: "PUBLISHED" },
    });
    expect(res.status()).toBe(403);
  });

  test("any staff member can read the LGA dashboard → 200", async () => {
    expect((await viewerCtx.get("/api/lga-dashboard/overview")).status()).toBe(200);
  });

  test("a staff member cannot manage staff (chairman-only) → 403", async () => {
    const res = await publisherCtx.post("/api/lga-dashboard/staff", {
      data: { name: "Nope", email: `x_${uniq()}@example.com`, role: "STAFF", canPublish: true, password: "Staff@1234" },
    });
    expect(res.status()).toBe(403);
  });

  test("the chairman can list staff → 200 with the two created members", async () => {
    const res = await chairman.ctx.get("/api/lga-dashboard/staff");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.staff)).toBe(true);
    expect(body.staff.length).toBeGreaterThanOrEqual(2);
  });
});
