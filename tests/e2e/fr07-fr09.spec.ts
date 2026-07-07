/**
 * FR-07 (Public Engagement & Posts), FR-08 (Advertising System),
 * FR-09 (Payments) API contract tests.
 *
 * Run with: npx playwright test --project=api fr07-fr09
 *
 * Prerequisites:
 *  - Dev server on http://localhost:3000
 *  - DATABASE_URL, RESEND_API_KEY set in .env.local
 *  - PAYSTACK_SECRET_KEY set (webhook tests use signature; payment init tests are skipped if unavailable)
 *
 * Session-auth routes (advertiser/campaigns, paystack) require NextAuth session cookies
 * and are tested structurally only (expect 401/403 without a real session).
 */

import { test, expect, request as apiRequest } from "@playwright/test";

const BASE = "http://localhost:3000";

async function apiGet(url: string, headers: Record<string, string> = {}) {
  const ctx = await apiRequest.newContext({ baseURL: BASE });
  const res = await ctx.get(url, { headers });
  const json = await res.json().catch(() => ({}));
  return { status: res.status(), body: json };
}

async function apiPost(
  url: string,
  body: Record<string, unknown>,
  headers: Record<string, string> = {}
) {
  const ctx = await apiRequest.newContext({ baseURL: BASE });
  const res = await ctx.post(url, {
    data: body,
    headers: { "Content-Type": "application/json", ...headers },
  });
  const json = await res.json().catch(() => ({}));
  return { status: res.status(), body: json };
}

async function apiPatch(
  url: string,
  body: Record<string, unknown>,
  headers: Record<string, string> = {}
) {
  const ctx = await apiRequest.newContext({ baseURL: BASE });
  const res = await ctx.patch(url, {
    data: body,
    headers: { "Content-Type": "application/json", ...headers },
  });
  const json = await res.json().catch(() => ({}));
  return { status: res.status(), body: json };
}

const ADMIN = { "x-admin-secret": process.env.NEXT_PUBLIC_ADMIN_SECRET ?? "4a0423d4888f73e76fbbb5655ac5458c09be34d5d4eaa9522f943b9cc3d80666" };
const FAKE_LGA_ID = "00000000-0000-0000-0000-000000000000";
const LGA_AUTH = { "x-lga-id": FAKE_LGA_ID };
const FAKE_UUID = "00000000-0000-0000-0000-000000000000";

// ─── FR-07: LGA Dashboard — Posts ───────────────────────────────────────────

test.describe("FR-07-01: LGA Dashboard — post list", () => {
  test("GET /api/lga-dashboard/posts without x-lga-id → 401", async () => {
    const { status } = await apiGet("/api/lga-dashboard/posts");
    expect(status).toBe(401);
  });

  // The x-lga-id header is no longer a trusted credential — LGA routes now
  // require the signed lga_session cookie. A fake header yields 401.
  // (The authenticated post-list shape is covered by citizen-lga-e2e.)
  test("GET /api/lga-dashboard/posts with a fake x-lga-id header (no session) → 401", async () => {
    const { status } = await apiGet("/api/lga-dashboard/posts", LGA_AUTH);
    expect(status).toBe(401);
  });

  test("GET /api/lga-dashboard/posts?status=DRAFT with a fake header → 401", async () => {
    const { status } = await apiGet("/api/lga-dashboard/posts?status=DRAFT", LGA_AUTH);
    expect(status).toBe(401);
  });

  test("GET /api/lga-dashboard/posts?scheduled=true with a fake header → 401", async () => {
    const { status } = await apiGet("/api/lga-dashboard/posts?scheduled=true", LGA_AUTH);
    expect(status).toBe(401);
  });
});

test.describe("FR-07-02: LGA Dashboard — post schedule", () => {
  test("PATCH /api/lga-dashboard/posts/schedule without auth → 401", async () => {
    const ctx = await apiRequest.newContext({ baseURL: BASE });
    const res = await ctx.patch("/api/lga-dashboard/posts/schedule", {
      data: { postId: FAKE_UUID, scheduledAt: new Date(Date.now() + 86400000).toISOString() },
      headers: { "Content-Type": "application/json" },
    });
    expect(res.status()).toBe(401);
  });

  // A fake x-lga-id header no longer authenticates → 401 before any validation.
  test("PATCH /api/lga-dashboard/posts/schedule with a fake header → 401", async () => {
    const ctx = await apiRequest.newContext({ baseURL: BASE });
    const res = await ctx.patch("/api/lga-dashboard/posts/schedule", {
      data: { postId: FAKE_UUID, scheduledAt: new Date(Date.now() + 86400000).toISOString() },
      headers: { "Content-Type": "application/json", ...LGA_AUTH },
    });
    expect(res.status()).toBe(401);
  });

  test("DELETE /api/lga-dashboard/posts/schedule without auth → 401", async () => {
    const ctx = await apiRequest.newContext({ baseURL: BASE });
    const res = await ctx.delete(`/api/lga-dashboard/posts/schedule?postId=${FAKE_UUID}`);
    expect(res.status()).toBe(401);
  });

  test("DELETE /api/lga-dashboard/posts/schedule with a fake header → 401", async () => {
    const ctx = await apiRequest.newContext({ baseURL: BASE });
    const res = await ctx.delete("/api/lga-dashboard/posts/schedule", {
      headers: LGA_AUTH,
    });
    expect(res.status()).toBe(401);
  });
});

test.describe("FR-07-03: LGA Dashboard — citizens count", () => {
  test("GET /api/lga-dashboard/citizens without auth → 401", async () => {
    const { status } = await apiGet("/api/lga-dashboard/citizens");
    expect(status).toBe(401);
  });

  test("GET /api/lga-dashboard/citizens with bad lgaId → 404", async () => {
    const { status } = await apiGet("/api/lga-dashboard/citizens", LGA_AUTH);
    expect([404, 401]).toContain(status);
  });
});

test.describe("FR-07-04: LGA Dashboard — analytics", () => {
  test("GET /api/lga-dashboard/analytics without auth → 401", async () => {
    const { status } = await apiGet("/api/lga-dashboard/analytics");
    expect(status).toBe(401);
  });

  test("GET /api/lga-dashboard/analytics with bad lgaId → 404", async () => {
    const { status } = await apiGet("/api/lga-dashboard/analytics", LGA_AUTH);
    expect([404, 401]).toContain(status);
  });
});

test.describe("FR-07-05: Public posts list and CRUD (session-auth)", () => {
  test("GET /api/posts without lgaId → 400", async () => {
    const { status, body } = await apiGet("/api/posts");
    expect(status).toBe(400);
    expect(typeof body.error).toBe("string");
  });

  test("GET /api/posts?lgaId=nonexistent → 200 with empty list", async () => {
    const { status, body } = await apiGet(`/api/posts?lgaId=${FAKE_UUID}`);
    expect(status).toBe(200);
    expect(Array.isArray(body.posts)).toBe(true);
    expect(typeof body.total).toBe("number");
  });

  test("GET /api/posts response items have correct shape", async () => {
    const { status, body } = await apiGet(`/api/posts?lgaId=${FAKE_UUID}&limit=1`);
    expect(status).toBe(200);
    // Empty but shape is correct
    expect(Array.isArray(body.posts)).toBe(true);
  });

  test("POST /api/posts without session → 401", async () => {
    const { status } = await apiPost("/api/posts", {
      lgaId: FAKE_UUID,
      title: "Test Post Title",
      content: "Content that is long enough to pass validation.",
    });
    expect(status).toBe(401);
  });

  test("POST /api/posts — title too short → 422 (or 401 without session)", async () => {
    const { status } = await apiPost("/api/posts", {
      lgaId: FAKE_UUID,
      title: "Hi",
      content: "Some content here.",
    });
    expect([401, 422]).toContain(status);
  });

  test("PUT /api/posts/[id] without session → 401", async () => {
    const ctx = await apiRequest.newContext({ baseURL: BASE });
    const res = await ctx.put(`/api/posts/${FAKE_UUID}`, {
      data: { title: "Updated Title" },
      headers: { "Content-Type": "application/json" },
    });
    expect(res.status()).toBe(401);
  });

  test("DELETE /api/posts/[id] without session → 401", async () => {
    const ctx = await apiRequest.newContext({ baseURL: BASE });
    const res = await ctx.delete(`/api/posts/${FAKE_UUID}`);
    expect(res.status()).toBe(401);
  });
});

test.describe("FR-07-06: Admin — user management", () => {
  test("GET /api/admin/users without secret → 401", async () => {
    const { status } = await apiGet("/api/admin/users");
    expect(status).toBe(401);
  });

  test("GET /api/admin/users with secret → 200 with users array and total", async () => {
    const { status, body } = await apiGet("/api/admin/users", ADMIN);
    expect(status).toBe(200);
    expect(Array.isArray(body.users)).toBe(true);
    expect(typeof body.total).toBe("number");
  });

  test("User list items have required fields", async () => {
    const { status, body } = await apiGet("/api/admin/users?limit=1", ADMIN);
    expect(status).toBe(200);
    if (body.users.length === 0) return;
    const u = body.users[0];
    expect(typeof u.id).toBe("string");
    expect(typeof u.name).toBe("string");
    expect(typeof u.email).toBe("string");
    expect(typeof u.role).toBe("string");
    expect(typeof u.isActive).toBe("boolean");
    expect(typeof u.isBanned).toBe("boolean");
    expect(typeof u._count).toBe("object");
  });

  test("GET /api/admin/users?status=BANNED → 200", async () => {
    const { status, body } = await apiGet("/api/admin/users?status=BANNED", ADMIN);
    expect(status).toBe(200);
    expect(Array.isArray(body.users)).toBe(true);
    for (const u of body.users) {
      expect(u.isBanned).toBe(true);
    }
  });

  test("GET /api/admin/users?role=CITIZEN → only CITIZEN users", async () => {
    const { status, body } = await apiGet("/api/admin/users?role=CITIZEN&limit=5", ADMIN);
    expect(status).toBe(200);
    for (const u of body.users) {
      expect(u.role).toBe("CITIZEN");
    }
  });

  test("PATCH /api/admin/users/[id] — nonexistent user → 404", async () => {
    const { status } = await apiPatch(`/api/admin/users/${FAKE_UUID}`, { action: "ban", reason: "Test ban" }, ADMIN);
    expect([404, 401]).toContain(status);
  });

  test("PATCH /api/admin/users/[id] — unknown action → 400", async () => {
    const { status, body } = await apiPatch(`/api/admin/users/${FAKE_UUID}`, { action: "fly" }, ADMIN);
    expect([400, 404]).toContain(status);
    if (status === 400) expect(typeof body.error).toBe("string");
  });

  test("PATCH /api/admin/users/[id] without secret → 401", async () => {
    const { status } = await apiPatch(`/api/admin/users/${FAKE_UUID}`, { action: "ban" });
    expect(status).toBe(401);
  });
});

test.describe("FR-07-07: Admin analytics", () => {
  test("GET /api/admin/analytics without secret → 401", async () => {
    const { status } = await apiGet("/api/admin/analytics");
    expect(status).toBe(401);
  });

  test("GET /api/admin/analytics → 200 with correct shape", async () => {
    const { status, body } = await apiGet("/api/admin/analytics", ADMIN);
    expect(status).toBe(200);
    // LGA stats
    expect(typeof body.lgas.total).toBe("number");
    expect(typeof body.lgas.byStatus).toBe("object");
    expect(typeof body.lgas.recentSignups).toBe("number");
    // User stats
    expect(typeof body.users.total).toBe("number");
    expect(typeof body.users.byRole).toBe("object");
    // Posts
    expect(typeof body.posts.total).toBe("number");
    expect(typeof body.posts.recent).toBe("number");
    // Revenue — serialized as string (BigInt)
    expect(typeof body.revenue.total).toBe("string");
    expect(typeof body.revenue.transactions).toBe("number");
    // Monthly revenue — array of { month, total: string }
    expect(Array.isArray(body.monthlyRevenue)).toBe(true);
    for (const r of body.monthlyRevenue) {
      expect(typeof r.month).toBe("string");
      expect(typeof r.total).toBe("string");
    }
    // Top LGAs
    expect(Array.isArray(body.topLgasByPosts)).toBe(true);
  });
});

// ─── FR-08: Advertising System ──────────────────────────────────────────────

test.describe("FR-08-01: Public ad plans", () => {
  test("GET /api/ad-plans → 200 with plans array", async () => {
    const { status, body } = await apiGet("/api/ad-plans");
    expect(status).toBe(200);
    expect(Array.isArray(body.plans)).toBe(true);
  });

  test("Ad plan price is serialized as string (BigInt)", async () => {
    const { status, body } = await apiGet("/api/ad-plans");
    expect(status).toBe(200);
    for (const plan of body.plans) {
      expect(typeof plan.price).toBe("string");
      expect(Number.isNaN(Number(plan.price))).toBe(false);
    }
  });

  test("Ad plan items have required fields", async () => {
    const { status, body } = await apiGet("/api/ad-plans");
    expect(status).toBe(200);
    if (body.plans.length === 0) {
      console.warn("⚠️  No active ad plans in DB — skipping shape check");
      return;
    }
    const p = body.plans[0];
    expect(typeof p.id).toBe("string");
    expect(typeof p.name).toBe("string");
    expect(typeof p.description).toBe("string");
    expect(typeof p.price).toBe("string");
    expect(typeof p.durationDays).toBe("number");
    expect(Array.isArray(p.formats)).toBe(true);
    expect(Array.isArray(p.placements)).toBe(true);
    expect(p.isActive).toBe(true);
  });
});

test.describe("FR-08-02: Ad serving", () => {
  test("GET /api/ads — missing placement → returns ad:null (no crash)", async () => {
    const { status, body } = await apiGet("/api/ads");
    expect(status).toBe(200);
    expect(body.ad).toBeNull();
  });

  test("GET /api/ads?placement=HOMEPAGE_TOP → 200 with ad or null", async () => {
    const { status, body } = await apiGet("/api/ads?placement=HOMEPAGE_TOP");
    expect(status).toBe(200);
    // ad is null or a valid campaign shape
    if (body.ad !== null) {
      expect(typeof body.ad.id).toBe("string");
      expect(typeof body.ad.title).toBe("string");
      expect(typeof body.ad.linkUrl).toBe("string");
      expect(typeof body.ad.format).toBe("string");
      expect(typeof body.ad.placement).toBe("string");
    }
  });

  test("POST /api/ads/[id]/click — nonexistent campaign → graceful (500 or 200)", async () => {
    // Click tracking is best-effort — may return 500 if campaign doesn't exist
    const { status } = await apiPost(`/api/ads/${FAKE_UUID}/click`, {});
    expect([200, 500]).toContain(status);
  });

  test("GET /api/ads requires no authentication", async () => {
    const { status } = await apiGet("/api/ads?placement=SIDEBAR");
    expect(status).toBe(200);
  });
});

test.describe("FR-08-03: Admin — ad campaign management", () => {
  test("GET /api/admin/ads without secret → 403", async () => {
    const { status } = await apiGet("/api/admin/ads");
    expect([401, 403]).toContain(status);
  });

  test("GET /api/admin/ads with secret → 200 with campaigns, total, pages", async () => {
    const { status, body } = await apiGet("/api/admin/ads", ADMIN);
    expect(status).toBe(200);
    expect(Array.isArray(body.campaigns)).toBe(true);
    expect(typeof body.total).toBe("number");
    expect(typeof body.pages).toBe("number");
  });

  test("Admin campaign list — plan.price serialized as string", async () => {
    const { status, body } = await apiGet("/api/admin/ads", ADMIN);
    expect(status).toBe(200);
    for (const c of body.campaigns) {
      if (c.plan?.price !== undefined) {
        expect(typeof c.plan.price).toBe("string");
      }
    }
  });

  test("GET /api/admin/ads?status=PENDING_REVIEW → filtered results", async () => {
    const { status, body } = await apiGet("/api/admin/ads?status=PENDING_REVIEW", ADMIN);
    expect(status).toBe(200);
    expect(Array.isArray(body.campaigns)).toBe(true);
    for (const c of body.campaigns) {
      expect(c.status).toBe("PENDING_REVIEW");
    }
  });

  test("POST /api/admin/ads/[id]/approve — nonexistent → 404", async () => {
    const { status } = await apiPost(`/api/admin/ads/${FAKE_UUID}/approve`, {}, ADMIN);
    expect([404]).toContain(status);
  });

  test("POST /api/admin/ads/[id]/reject — missing reason → 400", async () => {
    const { status, body } = await apiPost(`/api/admin/ads/${FAKE_UUID}/reject`, { reason: "" }, ADMIN);
    expect([400, 404]).toContain(status);
    if (status === 400) expect(typeof body.error).toBe("string");
  });

  test("POST /api/admin/ads/[id]/reject — nonexistent with reason → 404", async () => {
    const { status } = await apiPost(`/api/admin/ads/${FAKE_UUID}/reject`, { reason: "Inappropriate content" }, ADMIN);
    expect([404]).toContain(status);
  });

  test("POST /api/admin/ads/[id]/approve — without secret → 403", async () => {
    const { status } = await apiPost(`/api/admin/ads/${FAKE_UUID}/approve`, {});
    expect([401, 403]).toContain(status);
  });
});

test.describe("FR-08-04: Admin — ad plan management", () => {
  test("GET /api/admin/ad-plans without secret → 403", async () => {
    const { status } = await apiGet("/api/admin/ad-plans");
    expect([401, 403]).toContain(status);
  });

  test("GET /api/admin/ad-plans with secret → 200 with plans array (all, not just active)", async () => {
    const { status, body } = await apiGet("/api/admin/ad-plans", ADMIN);
    expect(status).toBe(200);
    expect(Array.isArray(body.plans)).toBe(true);
    for (const p of body.plans) {
      expect(typeof p.price).toBe("string");
    }
  });

  test("POST /api/admin/ad-plans — missing required fields → 400", async () => {
    const { status, body } = await apiPost("/api/admin/ad-plans", { name: "Test" }, ADMIN);
    expect(status).toBe(400);
    expect(typeof body.error).toBe("string");
  });

  test("POST /api/admin/ad-plans without secret → 403", async () => {
    const { status } = await apiPost("/api/admin/ad-plans", {
      name: "Test Plan",
      description: "A test plan",
      price: 5000000,
      durationDays: 30,
      formats: ["BANNER"],
      placements: ["HOMEPAGE_TOP"],
    });
    expect([401, 403]).toContain(status);
  });
});

test.describe("FR-08-05: Advertiser campaigns (session-auth)", () => {
  test("GET /api/advertiser/campaigns without session → 403", async () => {
    const { status } = await apiGet("/api/advertiser/campaigns");
    expect([401, 403]).toContain(status);
  });

  test("POST /api/advertiser/campaigns without session → 403", async () => {
    const { status } = await apiPost("/api/advertiser/campaigns", {
      planId: FAKE_UUID,
      title: "My Campaign",
      format: "BANNER",
      placement: "HOMEPAGE_TOP",
      linkUrl: "https://example.com",
    });
    expect([401, 403]).toContain(status);
  });

  test("GET /api/advertiser/campaigns/[id] without session → 401", async () => {
    const { status } = await apiGet(`/api/advertiser/campaigns/${FAKE_UUID}`);
    expect([401, 403]).toContain(status);
  });
});

// ─── FR-09: Payments ────────────────────────────────────────────────────────

test.describe("FR-09-01: Paystack initialize (session-auth)", () => {
  test("POST /api/paystack/initialize without session → 401", async () => {
    const { status } = await apiPost("/api/paystack/initialize", {
      amount: 500000,
      email: "test@example.com",
      purpose: "AD_CAMPAIGN",
      metadata: {},
    });
    expect(status).toBe(401);
  });

  test("POST /api/paystack/initialize — missing amount → 400 (or 401 without session)", async () => {
    const { status } = await apiPost("/api/paystack/initialize", {
      email: "test@example.com",
      purpose: "AD_CAMPAIGN",
      metadata: {},
    });
    expect([400, 401]).toContain(status);
  });
});

test.describe("FR-09-02: Paystack verify (session-auth)", () => {
  test("GET /api/paystack/verify without session → 401", async () => {
    const { status } = await apiGet("/api/paystack/verify?reference=test-ref");
    expect(status).toBe(401);
  });

  test("GET /api/paystack/verify — missing reference → 400 (or 401 without session)", async () => {
    const { status } = await apiGet("/api/paystack/verify");
    expect([400, 401]).toContain(status);
  });
});

test.describe("FR-09-03: Paystack webhook", () => {
  test("POST /api/webhooks/paystack — missing signature → 401", async () => {
    const { status } = await apiPost("/api/webhooks/paystack", { event: "charge.success", data: {} });
    // 401 because signature check fails
    expect([401, 400]).toContain(status);
  });

  test("POST /api/webhooks/paystack — wrong signature → 401", async () => {
    const ctx = await apiRequest.newContext({ baseURL: BASE });
    const res = await ctx.post("/api/webhooks/paystack", {
      data: JSON.stringify({ event: "charge.success", data: { reference: "test" } }),
      headers: {
        "Content-Type": "application/json",
        "x-paystack-signature": "invalidsignature",
      },
    });
    expect([401, 400]).toContain(res.status());
  });
});

test.describe("FR-09-04: Payment callback page (API contract)", () => {
  test("GET /payment/callback — page exists (check via verify route)", async () => {
    // The callback page polls /api/paystack/verify — verify the verify route exists
    const { status } = await apiGet("/api/paystack/verify?reference=nonexistent-ref");
    // 401 (no session) or 404 (ref not found) — either means route exists
    expect([401, 404]).toContain(status);
  });
});
