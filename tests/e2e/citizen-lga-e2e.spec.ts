/**
 * End-to-end integration tests for a CITIZEN interacting with an LGA
 * chairman's portal — the public engagement loop.
 *
 * The story, exercised over real HTTP against the real database:
 *
 *   1. An LGA chairman registers and verifies their LGA (the portal).
 *   2. A post is PUBLISHED under that LGA (chairman/portal content).
 *   3. A citizen signs in and engages with it — reacts, comments, submits
 *      feedback (a rating), and flags/reports it.
 *   4. The chairman's dashboard reflects that citizen engagement, closing
 *      the loop.
 *
 * Every step is authenticated the way the app authenticates:
 *   - Citizens use the NextAuth Credentials session (JWT cookie).
 *   - Post authoring uses POST /api/posts, which authorises any logged-in
 *     User session and takes the target lgaId in its body.
 *   - The LGA dashboard is scoped by the `x-lga-id` header.
 *
 * Run with:  npx playwright test --project=api citizen-lga-e2e
 *
 * Prerequisites:
 *  - Dev server on http://localhost:3000 (webServer config starts it)
 *  - DATABASE_URL, AUTH_SECRET set in .env.local
 *
 * A randomized per-run forwarded-IP base keeps the setup endpoints' in-memory
 * rate limiters (register 5/15min, lga-register 3/hr) isolated across runs.
 * The engagement endpoints themselves are not rate limited.
 */

import { test, expect, request as apiRequest, type APIRequestContext } from "@playwright/test";
import { Pool } from "pg";
import { config } from "dotenv";

config({ path: ".env.local" });

const BASE = "http://localhost:3000";
const PASSWORD = "Secure@123";
const uniq = () => `${Date.now()}${Math.floor(Math.random() * 1000)}`;

// Own subnet (198.18.x) so buckets never overlap with auth-e2e's 198.51.x.
const RUN_OCTET = Math.floor(Math.random() * 254) + 1;
const ipFor = (role: number) => `198.18.${RUN_OCTET}.${role}`;

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

async function chairmanToken(email: string): Promise<string> {
  const { rows } = await pool.query(
    `SELECT vt.token FROM lga_verification_tokens vt
       JOIN lga_chairmen c ON c.id = vt."chairmanId"
      WHERE c.email = $1 ORDER BY vt."createdAt" DESC LIMIT 1`,
    [email]
  );
  return rows[0]?.token ?? "";
}

async function ctxForIp(ip: string): Promise<APIRequestContext> {
  return apiRequest.newContext({ baseURL: BASE, extraHTTPHeaders: { "x-forwarded-for": ip } });
}

/** Sign in via NextAuth Credentials and return the session (or {} on failure). */
async function credentialsLogin(ctx: APIRequestContext, email: string, password: string) {
  const { csrfToken } = await (await ctx.get("/api/auth/csrf")).json();
  await ctx.post("/api/auth/callback/credentials", {
    form: { csrfToken, email, password, redirect: "false", callbackUrl: BASE },
  });
  return (await (await ctx.get("/api/auth/session")).json()) ?? {};
}

/** Register, verify, and log in a fresh citizen; returns authed ctx + identity. */
async function authedCitizen(ip: string): Promise<{ ctx: APIRequestContext; email: string; id: string }> {
  const email = `citizen_${uniq()}@example.com`;
  const ctx = await ctxForIp(ip);

  const reg = await ctx.post("/api/auth/register", {
    data: { name: "Test Citizen", email, state: "Lagos", lga: "Ikeja", password: PASSWORD, confirmPassword: PASSWORD, terms: true },
  });
  expect(reg.status(), "citizen registration").toBe(201);

  const ver = await ctx.post("/api/auth/verify-email", { data: { token: await citizenToken(email) } });
  expect(ver.status(), "citizen email verification").toBe(200);

  const session = await credentialsLogin(ctx, email, PASSWORD);
  expect(session.user, "citizen session after login").toBeTruthy();

  return { ctx, email, id: session.user.id };
}

/** Register + verify an LGA chairman; returns the LGA identity. */
async function registerVerifiedLGA(ip: string): Promise<{ lgaId: string; lgaName: string; email: string }> {
  const suffix = uniq();
  const email = `chairman_${suffix}@example.com`;
  const lgaName = `Interactville ${suffix}`;
  const ctx = await ctxForIp(ip);

  const reg = await ctx.post("/api/lga/register", {
    data: {
      lgaName, state: "Lagos", chairmanName: "Chief Portal", email, phone: "08012345678",
      officeAddress: "1 Council Road, Ikeja", sectors: ["Health", "Education"],
      password: PASSWORD, confirmPassword: PASSWORD, terms: true,
    },
  });
  expect(reg.status(), "LGA registration").toBe(201);
  const { lgaId } = await reg.json();

  const ver = await ctx.post("/api/lga/verify", { data: { token: await chairmanToken(email) } });
  expect(ver.status(), "LGA email verification").toBe(200);

  return { lgaId, lgaName, email };
}

/** Publish a PUBLISHED post under an LGA using an authenticated context. */
async function publishPost(ctx: APIRequestContext, lgaId: string): Promise<string> {
  const res = await ctx.post("/api/posts", {
    data: {
      lgaId,
      title: "Ward 3 road project completed",
      content: "The council has completed the new access road serving ward 3 markets.",
      status: "PUBLISHED",
    },
  });
  expect(res.status(), "post publish").toBe(201);
  return (await res.json()).post.id;
}

// ─────────────────────────────────────────────────────────────────────────────

test.describe("Citizen ↔ LGA portal — engagement", () => {
  let lgaId: string;
  let postId: string;
  let citizen: { ctx: APIRequestContext; email: string; id: string };

  test.beforeAll(async () => {
    const lga = await registerVerifiedLGA(ipFor(1));
    lgaId = lga.lgaId;

    const publisher = await authedCitizen(ipFor(2)); // the portal author
    postId = await publishPost(publisher.ctx, lgaId);

    citizen = await authedCitizen(ipFor(3)); // the engaging citizen
  });

  // ── Visibility ──────────────────────────────────────────────────────────
  test("the LGA's published post is publicly listed", async () => {
    const anon = await apiRequest.newContext({ baseURL: BASE });
    const res = await anon.get(`/api/posts?lgaId=${lgaId}`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.total).toBeGreaterThanOrEqual(1);
    const mine = body.posts.find((p: { id: string }) => p.id === postId);
    expect(mine).toBeTruthy();
    expect(mine.status).toBe("PUBLISHED");
  });

  // ── Reactions ───────────────────────────────────────────────────────────
  test("reacting without a session → 401", async () => {
    const anon = await apiRequest.newContext({ baseURL: BASE });
    const res = await anon.post("/api/reactions", { data: { contentId: postId, contentType: "post", type: "LIKE" } });
    expect(res.status()).toBe(401);
  });

  test("a citizen can LIKE the post → 200 with counts and myReaction", async () => {
    const res = await citizen.ctx.post("/api/reactions", { data: { contentId: postId, contentType: "post", type: "LIKE" } });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.counts.LIKE).toBe(1);
    expect(body.myReaction).toBe("LIKE");
  });

  test("public reaction counts reflect the like", async () => {
    const anon = await apiRequest.newContext({ baseURL: BASE });
    const res = await anon.get(`/api/reactions?contentId=${postId}&contentType=post`);
    expect(res.status()).toBe(200);
    expect((await res.json()).counts.LIKE).toBe(1);
  });

  test("re-sending the same reaction toggles it off", async () => {
    const res = await citizen.ctx.post("/api/reactions", { data: { contentId: postId, contentType: "post", type: "LIKE" } });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.counts.LIKE ?? 0).toBe(0);
    expect(body.myReaction).toBeNull();
  });

  test("switching to a different reaction type updates in place", async () => {
    const res = await citizen.ctx.post("/api/reactions", { data: { contentId: postId, contentType: "post", type: "SUPPORT" } });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.counts.SUPPORT).toBe(1);
    expect(body.counts.LIKE ?? 0).toBe(0);
    expect(body.myReaction).toBe("SUPPORT");
  });

  test("an invalid reaction type → 422", async () => {
    const res = await citizen.ctx.post("/api/reactions", { data: { contentId: postId, contentType: "post", type: "WOW" } });
    expect(res.status()).toBe(422);
  });

  // ── Comments ────────────────────────────────────────────────────────────
  test("commenting without a session → 401", async () => {
    const anon = await apiRequest.newContext({ baseURL: BASE });
    const res = await anon.post("/api/comments", { data: { contentId: postId, contentType: "post", content: "Nice" } });
    expect(res.status()).toBe(401);
  });

  test("a citizen can comment on the post → 201 attributed to them", async () => {
    const res = await citizen.ctx.post("/api/comments", {
      data: { contentId: postId, contentType: "post", content: "Great to see this progress in ward 3!" },
    });
    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body.comment.content).toBe("Great to see this progress in ward 3!");
    expect(body.comment.user.id).toBe(citizen.id);
  });

  test("the comment appears in the public thread", async () => {
    const anon = await apiRequest.newContext({ baseURL: BASE });
    const res = await anon.get(`/api/comments?contentId=${postId}&contentType=post`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.total).toBeGreaterThanOrEqual(1);
    expect(body.comments[0].content).toContain("ward 3");
  });

  test("an empty comment → 422", async () => {
    const res = await citizen.ctx.post("/api/comments", { data: { contentId: postId, contentType: "post", content: "   " } });
    expect(res.status()).toBe(422);
  });

  // ── Feedback (ratings) ──────────────────────────────────────────────────
  test("submitting feedback without a session → 401", async () => {
    const anon = await apiRequest.newContext({ baseURL: BASE });
    const res = await anon.post("/api/feedback", { data: { postId, rating: 5, category: "Infrastructure", message: "Good work overall." } });
    expect(res.status()).toBe(401);
  });

  test("a citizen can submit a rating + feedback → 201", async () => {
    const res = await citizen.ctx.post("/api/feedback", {
      data: { postId, rating: 5, category: "Infrastructure", message: "The new road has improved commuting." },
    });
    expect(res.status()).toBe(201);
    expect((await res.json()).success).toBe(true);
  });

  test("a second feedback from the same citizen → 409", async () => {
    const res = await citizen.ctx.post("/api/feedback", {
      data: { postId, rating: 3, category: "Infrastructure", message: "Trying to submit feedback again." },
    });
    expect(res.status()).toBe(409);
  });

  test("feedback on a nonexistent post → 404", async () => {
    const res = await citizen.ctx.post("/api/feedback", {
      data: { postId: "does-not-exist", rating: 4, category: "Other", message: "Feedback for a missing post." },
    });
    expect(res.status()).toBe(404);
  });

  test("an out-of-range rating → 422", async () => {
    const res = await citizen.ctx.post("/api/feedback", {
      data: { postId, rating: 6, category: "Infrastructure", message: "Rating out of the allowed range." },
    });
    expect(res.status()).toBe(422);
  });

  // ── Flag / report ───────────────────────────────────────────────────────
  test("flagging without a session → 401", async () => {
    const anon = await apiRequest.newContext({ baseURL: BASE });
    const res = await anon.post("/api/flag", { data: { postId, reason: "SPAM" } });
    expect(res.status()).toBe(401);
  });

  test("a citizen can flag/report the post → 201", async () => {
    const res = await citizen.ctx.post("/api/flag", { data: { postId, reason: "MISINFORMATION", details: "Figures look inflated." } });
    expect(res.status()).toBe(201);
    expect((await res.json()).success).toBe(true);
  });

  test("a second flag from the same citizen → 409", async () => {
    const res = await citizen.ctx.post("/api/flag", { data: { postId, reason: "SPAM" } });
    expect(res.status()).toBe(409);
  });

  test("an invalid flag reason → 422", async () => {
    const res = await citizen.ctx.post("/api/flag", { data: { postId, reason: "NOT_A_REASON" } });
    expect(res.status()).toBe(422);
  });

  // ── Loop closure: the chairman's dashboard sees the engagement ───────────
  test("the chairman dashboard reflects the citizen's reaction and comment", async () => {
    const ctx = await apiRequest.newContext({ baseURL: BASE });
    const res = await ctx.get("/api/lga-dashboard/posts", { headers: { "x-lga-id": lgaId } });
    expect(res.status()).toBe(200);
    const body = await res.json();
    const mine = body.posts.find((p: { id: string }) => p.id === postId);
    expect(mine, "the published post is visible on the dashboard").toBeTruthy();
    expect(mine._count.reactions).toBeGreaterThanOrEqual(1);
    expect(mine._count.comments).toBeGreaterThanOrEqual(1);
  });

  test("the dashboard rejects requests without the LGA identity → 401", async () => {
    const ctx = await apiRequest.newContext({ baseURL: BASE });
    const res = await ctx.get("/api/lga-dashboard/posts");
    expect(res.status()).toBe(401);
  });
});
