/**
 * End-to-end CRUD coverage for the LGA chairman's content features, over real
 * HTTP against the real database, using the verified LGA session:
 *
 *   - Wards & councillors        (/api/lgas/wards)
 *   - Press releases             (/api/lga-dashboard/press-releases)
 *   - Tenure re-election         (/api/lga-dashboard/tenure/reelection)
 *   - Projects                   (/api/lga-dashboard/projects) — needs an
 *                                admin-approved LGA
 *
 * Complements the auth/ownership suites (lga-portal-auth-e2e) with the actual
 * create/read/update/delete happy paths plus the unauth negatives.
 *
 * Run with:  npx playwright test --project=api chairman-crud-e2e
 */

import { test, expect, request as apiRequest, type APIRequestContext } from "@playwright/test";
import { Pool } from "pg";
import { config } from "dotenv";

config({ path: ".env.local" });

const BASE = "http://localhost:3000";
const PASSWORD = "Secure@123";
const uniq = () => `${Date.now()}${Math.floor(Math.random() * 1000)}`;

// Own subnet (198.21.x) so rate-limit buckets don't overlap with sibling specs.
const RUN_OCTET = Math.floor(Math.random() * 254) + 1;
const ipFor = (role: number) => `198.21.${RUN_OCTET}.${role}`;

const ADMIN = { "x-admin-secret": process.env.ADMIN_SECRET ?? process.env.NEXT_PUBLIC_ADMIN_SECRET ?? "" };

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
      lgaName: `Governville ${suffix}`, state: "Lagos", chairmanName: "Chief Govern",
      email, phone: "08012345678", officeAddress: "1 Council Road, Ikeja",
      sectors: ["Health"], password: PASSWORD, confirmPassword: PASSWORD, terms: true,
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

/** Approve an LGA via the admin endpoint (required before it can create projects). */
async function approveLGA(lgaId: string): Promise<void> {
  const admin = await apiRequest.newContext({ baseURL: BASE });
  const res = await admin.post(`/api/admin/lgas/${lgaId}/approve`, { headers: ADMIN });
  expect(res.status(), "admin approve LGA").toBe(200);
}

// ─── Wards ───────────────────────────────────────────────────────────────────

test.describe("Chairman CRUD — wards & councillors", () => {
  let lga: { ctx: APIRequestContext; lgaId: string };
  let other: { ctx: APIRequestContext; lgaId: string };
  let wardId: string;

  test.beforeAll(async () => {
    lga = await authedLGA(ipFor(1));
    other = await authedLGA(ipFor(2));
  });

  test("creating a ward without a session → 401", async () => {
    const anon = await apiRequest.newContext({ baseURL: BASE });
    const res = await anon.post("/api/lgas/wards", {
      data: { wardName: "Ward A", councillorName: "Hon. Doe" },
    });
    expect(res.status()).toBe(401);
  });

  test("the chairman creates a ward → 201 pinned to its LGA", async () => {
    const res = await lga.ctx.post("/api/lgas/wards", {
      data: { wardName: "Ward 1", wardNumber: 1, councillorName: "Hon. Ada Obi", population: "12000" },
    });
    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body.ward.lgaId).toBe(lga.lgaId);
    wardId = body.ward.id;
  });

  test("the ward is publicly listed for the LGA", async () => {
    const anon = await apiRequest.newContext({ baseURL: BASE });
    const res = await anon.get(`/api/lgas/wards?lgaId=${lga.lgaId}`);
    expect(res.status()).toBe(200);
    expect((await res.json()).wards.some((w: { id: string }) => w.id === wardId)).toBe(true);
  });

  test("the chairman updates its own ward → 200", async () => {
    const res = await lga.ctx.put("/api/lgas/wards", { data: { id: wardId, councillorName: "Hon. Ada Obi-Updated" } });
    expect(res.status()).toBe(200);
    expect((await res.json()).ward.councillorName).toBe("Hon. Ada Obi-Updated");
  });

  test("another LGA cannot update this ward → 404", async () => {
    const res = await other.ctx.put("/api/lgas/wards", { data: { id: wardId, councillorName: "Hijacked" } });
    expect(res.status()).toBe(404);
  });

  test("the chairman deletes its own ward → 200", async () => {
    const res = await lga.ctx.delete(`/api/lgas/wards?id=${wardId}`);
    expect(res.status()).toBe(200);
  });
});

// ─── Press releases ──────────────────────────────────────────────────────────

test.describe("Chairman CRUD — press releases", () => {
  let lga: { ctx: APIRequestContext; lgaId: string };

  test.beforeAll(async () => {
    lga = await authedLGA(ipFor(3));
  });

  test("posting a press release without a session → 401", async () => {
    const anon = await apiRequest.newContext({ baseURL: BASE });
    const res = await anon.post("/api/lga-dashboard/press-releases", { data: { title: "T", body: "B" } });
    expect(res.status()).toBe(401);
  });

  test("the chairman publishes a press release → 201", async () => {
    const res = await lga.ctx.post("/api/lga-dashboard/press-releases", {
      data: { title: "Council commissions new water scheme", body: "The council today commissioned a borehole water scheme serving 3 wards." },
    });
    expect(res.status()).toBe(201);
    expect((await res.json()).release.title).toContain("water scheme");
  });

  test("missing title/body → 400", async () => {
    const res = await lga.ctx.post("/api/lga-dashboard/press-releases", { data: { title: "Only a title" } });
    expect(res.status()).toBe(400);
  });

  test("the chairman lists its press releases → 200 including the new one", async () => {
    const res = await lga.ctx.get("/api/lga-dashboard/press-releases");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.releases)).toBe(true);
    expect(body.releases.some((r: { title: string }) => r.title.includes("water scheme"))).toBe(true);
  });
});

// ─── Tenure re-election ──────────────────────────────────────────────────────

test.describe("Chairman CRUD — tenure re-election", () => {
  let lga: { ctx: APIRequestContext; lgaId: string };

  test.beforeAll(async () => {
    lga = await authedLGA(ipFor(4));
  });

  test("submitting a re-election without a session → 401", async () => {
    const anon = await apiRequest.newContext({ baseURL: BASE });
    const res = await anon.post("/api/lga-dashboard/tenure/reelection", {
      data: { newEndDate: "2030-01-01", fileData: "AAAA", fileName: "cert.pdf", mimeType: "application/pdf" },
    });
    expect(res.status()).toBe(401);
  });

  test("the chairman submits a re-election → success and a new active tenure", async () => {
    const res = await lga.ctx.post("/api/lga-dashboard/tenure/reelection", {
      data: {
        newEndDate: "2030-01-01",
        fileData: "JVBERi0xLjQK", // tiny base64 blob
        fileName: "certificate-of-election.pdf",
        mimeType: "application/pdf",
      },
    });
    expect([200, 201]).toContain(res.status());
    expect((await res.json()).success).toBe(true);

    const list = await lga.ctx.get("/api/lga-dashboard/tenure/reelection");
    expect(list.status()).toBe(200);
    const body = await list.json();
    expect(body.tenures.some((t: { isActive: boolean }) => t.isActive)).toBe(true);
  });
});

// ─── Projects (requires an approved LGA) ─────────────────────────────────────

test.describe("Chairman CRUD — projects", () => {
  let lga: { ctx: APIRequestContext; lgaId: string };
  let pending: { ctx: APIRequestContext; lgaId: string };
  let projectId: string;

  test.beforeAll(async () => {
    lga = await authedLGA(ipFor(5));
    await approveLGA(lga.lgaId);
    pending = await authedLGA(ipFor(6)); // left PENDING on purpose
  });

  test("creating a project without a session → 401", async () => {
    const anon = await apiRequest.newContext({ baseURL: BASE });
    const res = await anon.post("/api/lga-dashboard/projects", {
      data: { title: "New road", description: "A brand new access road for ward 2.", category: "ROADS_INFRASTRUCTURE" },
    });
    expect(res.status()).toBe(401);
  });

  test("a PENDING LGA cannot create a project → 403", async () => {
    const res = await pending.ctx.post("/api/lga-dashboard/projects", {
      data: { title: "Premature project", description: "This LGA is not approved yet.", category: "OTHER" },
    });
    expect(res.status()).toBe(403);
  });

  test("an approved LGA creates a project → 201", async () => {
    const res = await lga.ctx.post("/api/lga-dashboard/projects", {
      data: {
        title: "Ward 2 access road", description: "Construction of a 3km tarred access road serving ward 2 markets.",
        category: "ROADS_INFRASTRUCTURE", status: "IN_PROGRESS", isPublished: true,
      },
    });
    expect(res.status()).toBe(201);
    projectId = (await res.json()).project.id;
  });

  test("the chairman lists projects → 200 including the new one", async () => {
    const res = await lga.ctx.get("/api/lga-dashboard/projects");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.projects.some((p: { id: string }) => p.id === projectId)).toBe(true);
  });

  test("the chairman updates its project → 200", async () => {
    const res = await lga.ctx.patch(`/api/lga-dashboard/projects/${projectId}`, { data: { status: "COMPLETED" } });
    expect(res.status()).toBe(200);
  });

  test("another LGA cannot update this project → 404", async () => {
    const res = await pending.ctx.patch(`/api/lga-dashboard/projects/${projectId}`, { data: { status: "PENDING" } });
    expect(res.status()).toBe(404);
  });
});
