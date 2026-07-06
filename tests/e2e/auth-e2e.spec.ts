/**
 * End-to-end authentication integration tests.
 *
 * Exercises the FULL auth lifecycle for all four principal types the portal
 * supports:
 *
 *   1. CITIZEN        — User model, NextAuth Credentials provider (JWT session)
 *                       register → (blocked while unverified) → verify email → login → session
 *   2. LGA CHAIRMAN   — LGAChairman model, custom /api/lga/login endpoint
 *                       register → (403 while unverified) → verify email → login
 *   3. ADMIN          — shared-secret cookie session via /api/admin/auth
 *                       wrong pw → correct pw → recover secret → logout
 *   4. INVESTOR       — Investor model, registration-only (no login surface)
 *                       register → duplicate → validation
 *
 * …and the post-login account lifecycle for a citizen session:
 *
 *   5. PROFILE        — authenticated PATCH /api/profile + change-password
 *   6. FORGOT/RESET   — /api/auth/forgot-password → /api/auth/reset-password
 *   7. LOGOUT         — NextAuth sign-out clears the session and re-gates routes
 *   8. DELETE ACCOUNT — authenticated DELETE removes the account, blocks re-login
 *
 * These run without a browser — pure HTTP against the running dev server —
 * but they hit the real database, real password hashing, and the real
 * NextAuth credential callback, so they are genuine integration tests.
 *
 * Run with:  npx playwright test --project=api auth-e2e
 *
 * Prerequisites:
 *  - Dev server on http://localhost:3000 (webServer config starts it)
 *  - DATABASE_URL, ADMIN_PASSWORD, AUTH_SECRET set in .env.local
 *  - RESEND_API_KEY is optional — lib/email.ts degrades to a no-op sender
 *    when it is unset, so registration/reset emails are skipped harmlessly
 *
 * Each role uses a distinct x-forwarded-for IP, and the IP base is randomized
 * per run, so the API's in-memory per-IP rate limiters (register 5/15min,
 * lga-register 3/hr, login 5/15min) start from an empty bucket every run and
 * never collide — even against a long-lived dev server reused across runs.
 */

import { test, expect, request as apiRequest, type APIRequestContext } from "@playwright/test";
import { Pool } from "pg";
import { config } from "dotenv";

// Prisma/Next load .env.local; Playwright does not — load it explicitly.
config({ path: ".env.local" });

const BASE = "http://localhost:3000";
const PASSWORD = "Secure@123";
const uniq = () => `${Date.now()}${Math.floor(Math.random() * 1000)}`;

// The API's rate limiters are in-memory and keyed on the forwarded IP; they
// survive across test runs on a long-lived dev server. Give each run a fresh
// random IP base so its per-endpoint buckets start empty every time, and a
// distinct final octet per role so roles don't share buckets within a run.
const RUN_OCTET = Math.floor(Math.random() * 254) + 1;
const ipFor = (role: number) => `198.51.${RUN_OCTET}.${role}`;

// Shared DB pool for reading email-verification tokens (simulates the user
// clicking the link in the verification email).
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
test.afterAll(async () => { await pool.end(); });

/** Fetch the citizen (User) email-verification token straight from the DB. */
async function citizenToken(email: string): Promise<string> {
  const { rows } = await pool.query(
    `SELECT vt.token
       FROM verification_tokens vt
       JOIN users u ON u.id = vt."userId"
      WHERE u.email = $1
      ORDER BY vt."createdAt" DESC
      LIMIT 1`,
    [email]
  );
  return rows[0]?.token ?? "";
}

/** Fetch the LGA chairman email-verification token straight from the DB. */
async function chairmanToken(email: string): Promise<string> {
  const { rows } = await pool.query(
    `SELECT vt.token
       FROM lga_verification_tokens vt
       JOIN lga_chairmen c ON c.id = vt."chairmanId"
      WHERE c.email = $1
      ORDER BY vt."createdAt" DESC
      LIMIT 1`,
    [email]
  );
  return rows[0]?.token ?? "";
}

/** Fetch the most recent unused password-reset token for a citizen. */
async function passwordResetToken(email: string): Promise<string> {
  const { rows } = await pool.query(
    `SELECT prt.token
       FROM password_reset_tokens prt
       JOIN users u ON u.id = prt."userId"
      WHERE u.email = $1 AND prt.used = false
      ORDER BY prt."createdAt" DESC
      LIMIT 1`,
    [email]
  );
  return rows[0]?.token ?? "";
}

/** New APIRequestContext that pins a forwarded IP so rate limits don't collide. */
async function ctxForIp(ip: string): Promise<APIRequestContext> {
  return apiRequest.newContext({
    baseURL: BASE,
    extraHTTPHeaders: { "x-forwarded-for": ip },
  });
}

/**
 * Perform a NextAuth Credentials sign-in over HTTP and return the resulting
 * session object. Uses the same context throughout so the CSRF + session
 * cookies persist. Returns `{}` when authentication fails.
 */
async function credentialsLogin(ctx: APIRequestContext, email: string, password: string) {
  const csrfRes = await ctx.get("/api/auth/csrf");
  const { csrfToken } = await csrfRes.json();

  await ctx.post("/api/auth/callback/credentials", {
    form: { csrfToken, email, password, redirect: "false", callbackUrl: BASE },
  });

  const sessionRes = await ctx.get("/api/auth/session");
  // NextAuth returns literal `null` (not `{}`) when there is no active session.
  return (await sessionRes.json()) ?? {};
}

/** Perform a NextAuth sign-out on an already-authenticated context. */
async function signOut(ctx: APIRequestContext): Promise<void> {
  const csrfRes = await ctx.get("/api/auth/csrf");
  const { csrfToken } = await csrfRes.json();
  await ctx.post("/api/auth/signout", {
    form: { csrfToken, redirect: "false", callbackUrl: BASE },
  });
}

/**
 * Register, verify, and log in a brand-new citizen, returning an authenticated
 * context (session cookie set) plus the email used. The building blocks are
 * already covered by the Citizen describe below; this just composes them so
 * the account-lifecycle blocks can start from a signed-in state.
 */
async function authedCitizen(
  ip: string,
  password = PASSWORD
): Promise<{ ctx: APIRequestContext; email: string }> {
  const email = `citizen_${uniq()}@example.com`;
  const ctx = await ctxForIp(ip);

  const reg = await ctx.post("/api/auth/register", {
    data: { name: "Life Cycle", email, state: "Lagos", lga: "Ikeja", password, confirmPassword: password, terms: true },
  });
  expect(reg.status(), "citizen registration").toBe(201);

  const token = await citizenToken(email);
  const ver = await ctx.post("/api/auth/verify-email", { data: { token } });
  expect(ver.status(), "citizen email verification").toBe(200);

  const session = await credentialsLogin(ctx, email, password);
  expect(session.user, "citizen session after login").toBeTruthy();

  return { ctx, email };
}

// ─── 1. CITIZEN ──────────────────────────────────────────────────────────────

test.describe("Auth E2E — Citizen (NextAuth Credentials)", () => {
  const IP = ipFor(1);
  const email = `citizen_${uniq()}@example.com`;

  test("registration → 201 success", async () => {
    const ctx = await ctxForIp(IP);
    const res = await ctx.post("/api/auth/register", {
      data: {
        name: "Ada Citizen",
        email,
        phone: "08012345678",
        state: "Lagos",
        lga: "Ikeja",
        password: PASSWORD,
        confirmPassword: PASSWORD,
        terms: true,
      },
    });
    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  test("login is blocked before email verification (no session)", async () => {
    const ctx = await ctxForIp(IP);
    const session = await credentialsLogin(ctx, email, PASSWORD);
    expect(session.user).toBeFalsy();
  });

  test("email verification via token → 200", async () => {
    const token = await citizenToken(email);
    expect(token).toBeTruthy();
    const ctx = await ctxForIp(IP);
    const res = await ctx.post("/api/auth/verify-email", { data: { token } });
    expect(res.status()).toBe(200);
    expect((await res.json()).success).toBe(true);
  });

  test("login after verification → JWT session with role CITIZEN", async () => {
    const ctx = await ctxForIp(IP);
    const session = await credentialsLogin(ctx, email, PASSWORD);
    expect(session.user).toBeTruthy();
    expect(session.user.email).toBe(email);
    expect(session.user.role).toBe("CITIZEN");
    expect(typeof session.user.id).toBe("string");
  });

  test("wrong password → no session", async () => {
    const ctx = await ctxForIp(IP);
    const session = await credentialsLogin(ctx, email, "Wrong@Password1");
    expect(session.user).toBeFalsy();
  });

  test("duplicate registration → 409", async () => {
    const ctx = await ctxForIp(IP);
    const res = await ctx.post("/api/auth/register", {
      data: {
        name: "Ada Citizen",
        email,
        state: "Lagos",
        lga: "Ikeja",
        password: PASSWORD,
        confirmPassword: PASSWORD,
        terms: true,
      },
    });
    expect(res.status()).toBe(409);
  });
});

// ─── 2. LGA CHAIRMAN ─────────────────────────────────────────────────────────

test.describe("Auth E2E — LGA Chairman", () => {
  const IP = ipFor(2);
  const suffix = uniq();
  const email = `chairman_${suffix}@example.com`;
  const lgaName = `Testville ${suffix}`;

  const registrationPayload = {
    lgaName,
    state: "Lagos",
    chairmanName: "Chief Test",
    email,
    phone: "08012345678",
    officeAddress: "1 Council Road, Ikeja",
    population: "50000",
    description: "An LGA created for automated auth testing.",
    sectors: ["Health", "Education"],
    password: PASSWORD,
    confirmPassword: PASSWORD,
    terms: true,
  };

  test("registration → 201 with lgaId", async () => {
    const ctx = await ctxForIp(IP);
    const res = await ctx.post("/api/lga/register", { data: registrationPayload });
    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(typeof body.lgaId).toBe("string");
  });

  test("login before verification → 403 UNVERIFIED", async () => {
    const ctx = await ctxForIp(IP);
    const res = await ctx.post("/api/lga/login", { data: { email, password: PASSWORD } });
    expect(res.status()).toBe(403);
    expect((await res.json()).error).toBe("UNVERIFIED");
  });

  test("email verification via token → 200", async () => {
    const token = await chairmanToken(email);
    expect(token).toBeTruthy();
    const ctx = await ctxForIp(IP);
    const res = await ctx.post("/api/lga/verify", { data: { token } });
    expect(res.status()).toBe(200);
    expect((await res.json()).success).toBe(true);
  });

  test("login after verification → 200 with chairman payload", async () => {
    const ctx = await ctxForIp(IP);
    const res = await ctx.post("/api/lga/login", { data: { email, password: PASSWORD } });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.chairman.lgaName).toBe(lgaName);
    expect(body.chairman.state).toBe("Lagos");
    // Freshly-registered LGAs are PENDING admin approval but the chairman can still sign in.
    expect(body.chairman.status).toBe("PENDING");
  });

  test("wrong password → 401", async () => {
    const ctx = await ctxForIp(IP);
    const res = await ctx.post("/api/lga/login", { data: { email, password: "Wrong@Password1" } });
    expect(res.status()).toBe(401);
    expect(typeof (await res.json()).error).toBe("string");
  });

  test("duplicate email registration → 409", async () => {
    const ctx = await ctxForIp(IP);
    const res = await ctx.post("/api/lga/register", {
      data: { ...registrationPayload, lgaName: `${lgaName} Two` },
    });
    expect(res.status()).toBe(409);
  });
});

// ─── 3. ADMIN ────────────────────────────────────────────────────────────────

test.describe("Auth E2E — Admin (shared-secret cookie session)", () => {
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? process.env.ADMIN_SECRET ?? "";

  function extractCookie(setCookie: string): string {
    const m = setCookie.match(/admin_session=([^;]+)/);
    return m ? `admin_session=${m[1]}` : "";
  }

  test("wrong password → 401", async () => {
    const ctx = await apiRequest.newContext({ baseURL: BASE });
    const res = await ctx.post("/api/admin/auth", { data: { password: "definitely-wrong" } });
    expect(res.status()).toBe(401);
    expect((await res.json()).error).toBeTruthy();
  });

  test("correct password → 200 + HttpOnly session cookie", async () => {
    expect(ADMIN_PASSWORD, "ADMIN_PASSWORD must be set in .env.local").toBeTruthy();
    const ctx = await apiRequest.newContext({ baseURL: BASE });
    const res = await ctx.post("/api/admin/auth", { data: { password: ADMIN_PASSWORD } });
    expect(res.status()).toBe(200);
    expect((await res.json()).authenticated).toBe(true);
    const setCookie = res.headers()["set-cookie"] ?? "";
    expect(setCookie).toContain("admin_session=authenticated");
    expect(setCookie).toContain("HttpOnly");
  });

  test("secret recovery requires the session cookie", async () => {
    expect(ADMIN_PASSWORD).toBeTruthy();
    const ctx = await apiRequest.newContext({ baseURL: BASE });

    // No cookie → 401
    const noAuth = await ctx.get("/api/admin/auth");
    expect(noAuth.status()).toBe(401);

    // Login, then recover secret with the cookie
    const login = await ctx.post("/api/admin/auth", { data: { password: ADMIN_PASSWORD } });
    const cookie = extractCookie(login.headers()["set-cookie"] ?? "");
    expect(cookie).toBeTruthy();

    const withAuth = await ctx.get("/api/admin/auth", { headers: { cookie } });
    expect(withAuth.status()).toBe(200);
    expect(typeof (await withAuth.json()).secret).toBe("string");
  });

  test("logout clears the cookie (Max-Age=0)", async () => {
    const ctx = await apiRequest.newContext({ baseURL: BASE });
    const res = await ctx.delete("/api/admin/auth");
    expect(res.status()).toBe(200);
    expect((await res.json()).success).toBe(true);
    const setCookie = res.headers()["set-cookie"] ?? "";
    expect(setCookie).toContain("admin_session=");
    expect(setCookie).toContain("Max-Age=0");
  });
});

// ─── 4. INVESTOR ─────────────────────────────────────────────────────────────

test.describe("Auth E2E — Investor (registration onboarding)", () => {
  const email = `investor_${uniq()}@example.com`;

  const payload = {
    fullName: "Global Investor Ltd",
    email,
    phone: "08012345678",
    company: "Global Investor Ltd",
    country: "Nigeria",
    sectors: ["AGRICULTURE", "ENERGY"],
    minBudget: "1000000",
    maxBudget: "50000000",
    description: "Interested in agricultural and energy projects.",
  };

  test("registration → 201 with investorId", async () => {
    const ctx = await apiRequest.newContext({ baseURL: BASE });
    const res = await ctx.post("/api/investors/register", { data: payload });
    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(typeof body.investorId).toBe("string");
  });

  test("duplicate email → 409", async () => {
    const ctx = await apiRequest.newContext({ baseURL: BASE });
    const res = await ctx.post("/api/investors/register", { data: payload });
    expect(res.status()).toBe(409);
  });

  test("missing sectors → 422 validation error", async () => {
    const ctx = await apiRequest.newContext({ baseURL: BASE });
    const res = await ctx.post("/api/investors/register", {
      data: { fullName: "No Sectors", email: `nosec_${uniq()}@example.com`, country: "Nigeria", sectors: [] },
    });
    expect(res.status()).toBe(422);
    expect(typeof (await res.json()).error).toBe("string");
  });
});

// ─── 5. PROFILE (authenticated) ──────────────────────────────────────────────

test.describe("Auth E2E — Profile management", () => {
  const IP = ipFor(3);
  let ctx: APIRequestContext;
  let email: string;

  test.beforeAll(async () => {
    ({ ctx, email } = await authedCitizen(IP));
  });

  test("PATCH /api/profile without a session → 401", async () => {
    const anon = await apiRequest.newContext({ baseURL: BASE });
    const res = await anon.patch("/api/profile", { data: { name: "Nobody" } });
    expect(res.status()).toBe(401);
  });

  test("authenticated profile update → 200 with persisted fields", async () => {
    const res = await ctx.patch("/api/profile", {
      data: { name: "Renamed Citizen", phone: "08099998888", state: "Kano", lga: "Nassarawa" },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.user.name).toBe("Renamed Citizen");
    expect(body.user.phone).toBe("08099998888");
    expect(body.user.state).toBe("Kano");
    expect(body.user.email).toBe(email);
  });

  test("profile update with an invalid Nigerian phone → 400", async () => {
    const res = await ctx.patch("/api/profile", { data: { name: "Bad Phone", phone: "12345" } });
    expect(res.status()).toBe(400);
  });

  test("change password with the wrong current password → 400", async () => {
    const res = await ctx.post("/api/profile/change-password", {
      data: { currentPassword: "WrongCurrent@1", newPassword: "Rotated@456", confirmPassword: "Rotated@456" },
    });
    expect(res.status()).toBe(400);
  });

  test("change password → 200; new password logs in, old one is rejected", async () => {
    const res = await ctx.post("/api/profile/change-password", {
      data: { currentPassword: PASSWORD, newPassword: "Rotated@456", confirmPassword: "Rotated@456" },
    });
    expect(res.status()).toBe(200);

    const oldLogin = await credentialsLogin(await ctxForIp(IP), email, PASSWORD);
    expect(oldLogin.user).toBeFalsy();

    const newLogin = await credentialsLogin(await ctxForIp(IP), email, "Rotated@456");
    expect(newLogin.user).toBeTruthy();
  });
});

// ─── 6. FORGOT / RESET PASSWORD ──────────────────────────────────────────────

test.describe("Auth E2E — Forgot / reset password", () => {
  const IP = ipFor(4);
  let email: string;

  test.beforeAll(async () => {
    ({ email } = await authedCitizen(IP));
  });

  test("forgot-password for an unknown email → 200 (no account enumeration)", async () => {
    const ctx = await ctxForIp(IP);
    const res = await ctx.post("/api/auth/forgot-password", {
      data: { email: `nobody_${uniq()}@example.com` },
    });
    expect(res.status()).toBe(200);
    expect((await res.json()).success).toBe(true);
  });

  test("forgot-password for a known email → 200 and issues a reset token", async () => {
    const ctx = await ctxForIp(IP);
    const res = await ctx.post("/api/auth/forgot-password", { data: { email } });
    expect(res.status()).toBe(200);
    expect(await passwordResetToken(email)).toBeTruthy();
  });

  test("reset-password with an invalid token → 400", async () => {
    const ctx = await ctxForIp(IP);
    const res = await ctx.post("/api/auth/reset-password", {
      data: { token: "not-a-real-token", password: "Reset@999" },
    });
    expect(res.status()).toBe(400);
  });

  test("reset-password with a valid token → 200; new password works and the token is single-use", async () => {
    const ctx = await ctxForIp(IP);
    const token = await passwordResetToken(email);
    expect(token).toBeTruthy();

    const reset = await ctx.post("/api/auth/reset-password", { data: { token, password: "Reset@999" } });
    expect(reset.status()).toBe(200);

    // New password authenticates
    const login = await credentialsLogin(await ctxForIp(IP), email, "Reset@999");
    expect(login.user).toBeTruthy();

    // Same token cannot be reused
    const reuse = await ctx.post("/api/auth/reset-password", { data: { token, password: "Reset@000" } });
    expect(reuse.status()).toBe(400);
  });
});

// ─── 7. LOGOUT ───────────────────────────────────────────────────────────────

test.describe("Auth E2E — Logout", () => {
  const IP = ipFor(5);

  test("sign-out clears the session and re-protects gated routes", async () => {
    const { ctx } = await authedCitizen(IP);

    // Authenticated to start with
    const before = await ctx.get("/api/auth/session");
    expect((await before.json())?.user).toBeTruthy();

    await signOut(ctx);

    // Session is gone
    const after = await ctx.get("/api/auth/session");
    expect(await after.json()).toBeNull();

    // A gated route now rejects the (cleared) context
    const gated = await ctx.patch("/api/profile", { data: { name: "After Logout" } });
    expect(gated.status()).toBe(401);
  });
});

// ─── 8. DELETE ACCOUNT ───────────────────────────────────────────────────────

test.describe("Auth E2E — Delete account", () => {
  const IP = ipFor(6);

  test("DELETE /api/auth/delete-account without a session → 401", async () => {
    const anon = await apiRequest.newContext({ baseURL: BASE });
    const res = await anon.delete("/api/auth/delete-account");
    expect(res.status()).toBe(401);
  });

  test("authenticated deletion removes the account and blocks future login", async () => {
    const { ctx, email } = await authedCitizen(IP);

    const res = await ctx.delete("/api/auth/delete-account");
    expect(res.status()).toBe(200);
    expect((await res.json()).success).toBe(true);

    // The user row is gone (Prisma cascade cleans up related records)
    const { rows } = await pool.query(`SELECT count(*)::int AS n FROM users WHERE email = $1`, [email]);
    expect(rows[0].n).toBe(0);

    // Login now fails — the account no longer exists
    const login = await credentialsLogin(await ctxForIp(IP), email, PASSWORD);
    expect(login.user).toBeFalsy();
  });
});
