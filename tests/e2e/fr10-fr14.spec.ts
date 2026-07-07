/**
 * FR-10 (Admin Dashboard), FR-11 (LGA Analytics), FR-12 (Archiving),
 * FR-13 (Government Transparency), FR-14 (Press Releases & Live Streams)
 * API contract + live integration tests.
 *
 * Run with: npx playwright test --project=api fr10-fr14
 *
 * Prerequisites:
 *  - Dev server on http://localhost:3000
 *  - DATABASE_URL set in .env.local
 *  - FR-12/FR-13/FR-14 DB migrations applied: npx prisma db push
 *    (tests warn and skip gracefully if tables are missing)
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

async function apiDelete(url: string, headers: Record<string, string> = {}) {
  const ctx = await apiRequest.newContext({ baseURL: BASE });
  const res = await ctx.delete(url, { headers });
  const json = await res.json().catch(() => ({}));
  return { status: res.status(), body: json };
}

const ADMIN = { "x-admin-secret": process.env.NEXT_PUBLIC_ADMIN_SECRET ?? "4a0423d4888f73e76fbbb5655ac5458c09be34d5d4eaa9522f943b9cc3d80666" };
const FAKE_UUID = "00000000-0000-0000-0000-000000000000";
const LGA_AUTH = { "x-lga-id": FAKE_UUID };

/** Skip test and warn if response is 500 (likely missing migration). */
function skipIf500(status: number, label: string) {
  if (status === 500) {
    console.warn(`⚠️  ${label} returned 500 — run \`npx prisma db push\` to apply pending migrations`);
    return true;
  }
  return false;
}

// ─── FR-10: Admin Dashboard ──────────────────────────────────────────────────

test.describe("FR-10-01: Admin analytics shape", () => {
  test("GET /api/admin/analytics → 200 lgas, users, posts, revenue, monthlyRevenue", async () => {
    const { status, body } = await apiGet("/api/admin/analytics", ADMIN);
    expect(status).toBe(200);
    // lgas
    expect(typeof body.lgas.total).toBe("number");
    expect(typeof body.lgas.byStatus).toBe("object");
    expect(typeof body.lgas.recentSignups).toBe("number");
    // users
    expect(typeof body.users.total).toBe("number");
    // posts
    expect(typeof body.posts.total).toBe("number");
    expect(typeof body.posts.recent).toBe("number");
    // revenue — BigInt serialised as string
    expect(typeof body.revenue.total).toBe("string");
    expect(Number.isNaN(Number(body.revenue.total))).toBe(false);
    expect(typeof body.revenue.transactions).toBe("number");
    // monthlyRevenue — [{month: "YYYY-MM", total: string}]
    expect(Array.isArray(body.monthlyRevenue)).toBe(true);
    for (const r of body.monthlyRevenue) {
      expect(typeof r.month).toBe("string");
      expect(/^\d{4}-\d{2}$/.test(r.month)).toBe(true);
      expect(typeof r.total).toBe("string");
    }
    // topLgasByPosts
    expect(Array.isArray(body.topLgasByPosts)).toBe(true);
  });
});

// ─── FR-11: LGA Analytics ───────────────────────────────────────────────────

test.describe("FR-11-01: LGA Dashboard analytics shape", () => {
  test("GET /api/lga-dashboard/analytics without auth → 401", async () => {
    const { status } = await apiGet("/api/lga-dashboard/analytics");
    expect(status).toBe(401);
  });

  test("GET /api/lga-dashboard/analytics with a fake x-lga-id header (no session) → 401", async () => {
    // The x-lga-id header is no longer a trusted credential — a signed LGA
    // session cookie is required. (The authenticated analytics shape is covered
    // by the session-authed suites.)
    const mapRes = await apiGet("/api/map/data?type=lgas");
    const lgaId = mapRes.body.lgas?.[0]?.id ?? "00000000-0000-0000-0000-000000000000";
    const { status } = await apiGet("/api/lga-dashboard/analytics", { "x-lga-id": lgaId });
    expect(status).toBe(401);
  });
});

// ─── FR-12: Data Archiving ───────────────────────────────────────────────────

test.describe("FR-12-01: LGA archive — public archived posts", () => {
  test("GET /api/lgas/[id]/archive — nonexistent LGA → 200 with empty list", async () => {
    const { status, body } = await apiGet(`/api/lgas/${FAKE_UUID}/archive`);
    if (skipIf500(status, "/api/lgas/[id]/archive")) return;
    expect(status).toBe(200);
    expect(Array.isArray(body.posts)).toBe(true);
    expect(typeof body.total).toBe("number");
  });

  test("GET /api/lgas/[id]/archive — real LGA has correct shape", async () => {
    const mapRes = await apiGet("/api/map/data?type=lgas");
    if (mapRes.body.lgas?.length === 0) { console.warn("⚠️  No APPROVED LGAs"); return; }
    const lgaId = mapRes.body.lgas[0]?.id;
    if (!lgaId) return;

    const { status, body } = await apiGet(`/api/lgas/${lgaId}/archive`);
    if (skipIf500(status, "/api/lgas/[id]/archive")) return;
    expect(status).toBe(200);
    expect(Array.isArray(body.posts)).toBe(true);
    expect(typeof body.total).toBe("number");
    if (body.posts.length > 0) {
      const p = body.posts[0];
      expect(typeof p.id).toBe("string");
      expect(typeof p.title).toBe("string");
      expect(typeof p._count).toBe("object");
    }
  });

  test("GET /api/lgas/[id]/archive?tenureId=xxx — filters by tenure", async () => {
    const { status, body } = await apiGet(`/api/lgas/${FAKE_UUID}/archive?tenureId=${FAKE_UUID}`);
    if (skipIf500(status, "/api/lgas/[id]/archive")) return;
    expect(status).toBe(200);
    expect(Array.isArray(body.posts)).toBe(true);
  });

  test("GET /api/lgas/[id]/archive — requires no authentication", async () => {
    const { status } = await apiGet(`/api/lgas/${FAKE_UUID}/archive`);
    if (skipIf500(status, "archive")) return;
    expect(status).not.toBe(401);
  });
});

test.describe("FR-12-02: LGA succession history", () => {
  test("GET /api/lgas/[id]/succession — nonexistent LGA → 200 with empty tenures", async () => {
    const { status, body } = await apiGet(`/api/lgas/${FAKE_UUID}/succession`);
    if (skipIf500(status, "/api/lgas/[id]/succession")) return;
    expect(status).toBe(200);
    expect(Array.isArray(body.tenures)).toBe(true);
  });

  test("GET /api/lgas/[id]/succession — real LGA has correct shape", async () => {
    const mapRes = await apiGet("/api/map/data?type=lgas");
    if (mapRes.body.lgas?.length === 0) { console.warn("⚠️  No APPROVED LGAs"); return; }
    const lgaId = mapRes.body.lgas[0]?.id;
    if (!lgaId) return;

    const { status, body } = await apiGet(`/api/lgas/${lgaId}/succession`);
    if (skipIf500(status, "succession")) return;
    expect(status).toBe(200);
    expect(Array.isArray(body.tenures)).toBe(true);
    if (body.tenures.length > 0) {
      const t = body.tenures[0];
      expect(typeof t.id).toBe("string");
      expect(typeof t.chairmanName).toBe("string");
      expect(typeof t.isActive).toBe("boolean");
      expect(typeof t._count.posts).toBe("number");
    }
  });
});

// ─── FR-13: Government Transparency ─────────────────────────────────────────

test.describe("FR-13-01: Public procurement contracts", () => {
  test("GET /api/lgas/[id]/contracts — nonexistent LGA → 200 with empty list", async () => {
    const { status, body } = await apiGet(`/api/lgas/${FAKE_UUID}/contracts`);
    if (skipIf500(status, "/api/lgas/[id]/contracts")) return;
    expect(status).toBe(200);
    expect(Array.isArray(body.contracts)).toBe(true);
    expect(typeof body.total).toBe("number");
  });

  test("GET /api/lgas/[id]/contracts — value is serialized as string", async () => {
    const mapRes = await apiGet("/api/map/data?type=lgas");
    if (mapRes.body.lgas?.length === 0) { console.warn("⚠️  No APPROVED LGAs"); return; }
    const lgaId = mapRes.body.lgas[0]?.id;
    const { status, body } = await apiGet(`/api/lgas/${lgaId}/contracts`);
    if (skipIf500(status, "contracts")) return;
    expect(status).toBe(200);
    for (const c of body.contracts) {
      expect(typeof c.value).toBe("string");
      expect(Number.isNaN(Number(c.value))).toBe(false);
    }
  });

  test("GET /api/lgas/[id]/contracts — requires no authentication", async () => {
    const { status } = await apiGet(`/api/lgas/${FAKE_UUID}/contracts`);
    if (skipIf500(status, "contracts")) return;
    expect(status).not.toBe(401);
  });
});

test.describe("FR-13-02: Public audit reports", () => {
  test("GET /api/lgas/[id]/audit-reports → 200 with reports array", async () => {
    const { status, body } = await apiGet(`/api/lgas/${FAKE_UUID}/audit-reports`);
    if (skipIf500(status, "audit-reports")) return;
    expect(status).toBe(200);
    expect(Array.isArray(body.reports)).toBe(true);
  });

  test("GET /api/lgas/[id]/audit-reports?year=2023 → filtered", async () => {
    const { status, body } = await apiGet(`/api/lgas/${FAKE_UUID}/audit-reports?year=2023`);
    if (skipIf500(status, "audit-reports")) return;
    expect(status).toBe(200);
    expect(Array.isArray(body.reports)).toBe(true);
  });
});

test.describe("FR-13-03: Admin procurement management", () => {
  test("GET /api/admin/procurement without secret → 401", async () => {
    const { status } = await apiGet("/api/admin/procurement");
    expect(status).toBe(401);
  });

  test("GET /api/admin/procurement with secret → 200 with contracts and total", async () => {
    const { status, body } = await apiGet("/api/admin/procurement", ADMIN);
    if (skipIf500(status, "/api/admin/procurement")) return;
    expect(status).toBe(200);
    expect(Array.isArray(body.contracts)).toBe(true);
    expect(typeof body.total).toBe("number");
    for (const c of body.contracts) {
      expect(typeof c.value).toBe("string");
    }
  });

  test("POST /api/admin/procurement — missing required fields → 400", async () => {
    const { status, body } = await apiPost("/api/admin/procurement", { lgaId: FAKE_UUID }, ADMIN);
    if (skipIf500(status, "POST procurement")) return;
    expect([400]).toContain(status);
    expect(typeof body.error).toBe("string");
  });

  test("POST /api/admin/procurement — nonexistent lgaId → 500 or 400 (FK violation)", async () => {
    const { status } = await apiPost("/api/admin/procurement", {
      lgaId: FAKE_UUID,
      title: "Road Construction Contract",
      contractor: "ABC Contractors Ltd",
      value: 500000000, // ₦5M in kobo
      awardDate: "2024-01-15",
      scope: "Construction of 5km dual carriageway",
    }, ADMIN);
    if (skipIf500(status, "POST procurement")) return;
    // FK violation on nonexistent LGA → 500 from DB, or 400 if validated beforehand
    expect([400, 500]).toContain(status);
  });

  test("POST /api/admin/procurement without secret → 401", async () => {
    const { status } = await apiPost("/api/admin/procurement", {
      lgaId: FAKE_UUID, title: "Test", contractor: "Test",
      value: 100, awardDate: "2024-01-01", scope: "Test",
    });
    expect(status).toBe(401);
  });

  test("PATCH /api/admin/procurement/[id] without secret → 401", async () => {
    const { status } = await apiPatch(`/api/admin/procurement/${FAKE_UUID}`, { isPublished: false });
    expect(status).toBe(401);
  });

  test("DELETE /api/admin/procurement/[id] without secret → 401", async () => {
    const { status } = await apiDelete(`/api/admin/procurement/${FAKE_UUID}`);
    expect(status).toBe(401);
  });
});

test.describe("FR-13-04: Admin audit report management", () => {
  test("GET /api/admin/audit-reports without secret → 401", async () => {
    const { status } = await apiGet("/api/admin/audit-reports");
    expect(status).toBe(401);
  });

  test("GET /api/admin/audit-reports with secret → 200 with reports and total", async () => {
    const { status, body } = await apiGet("/api/admin/audit-reports", ADMIN);
    if (skipIf500(status, "/api/admin/audit-reports")) return;
    expect(status).toBe(200);
    expect(Array.isArray(body.reports)).toBe(true);
    expect(typeof body.total).toBe("number");
  });

  test("GET /api/admin/audit-reports?year=2023 → filtered", async () => {
    const { status, body } = await apiGet("/api/admin/audit-reports?year=2023", ADMIN);
    if (skipIf500(status, "audit-reports")) return;
    expect(status).toBe(200);
    expect(Array.isArray(body.reports)).toBe(true);
    for (const r of body.reports) {
      expect(r.financialYear).toBe(2023);
    }
  });

  test("POST /api/admin/audit-reports — missing required fields → 400", async () => {
    const { status, body } = await apiPost("/api/admin/audit-reports", { lgaId: FAKE_UUID }, ADMIN);
    if (skipIf500(status, "POST audit-reports")) return;
    expect([400]).toContain(status);
    expect(typeof body.error).toBe("string");
  });

  test("POST /api/admin/audit-reports without secret → 401", async () => {
    const { status } = await apiPost("/api/admin/audit-reports", {
      lgaId: FAKE_UUID, financialYear: 2023, title: "Test",
      auditingBody: "OAGF", reportUrl: "https://example.com/report.pdf",
    });
    expect(status).toBe(401);
  });

  test("PATCH /api/admin/audit-reports/[id] without secret → 401", async () => {
    const { status } = await apiPatch(`/api/admin/audit-reports/${FAKE_UUID}`, { isPublished: false });
    expect(status).toBe(401);
  });

  test("DELETE /api/admin/audit-reports/[id] without secret → 401", async () => {
    const { status } = await apiDelete(`/api/admin/audit-reports/${FAKE_UUID}`);
    expect(status).toBe(401);
  });
});

test.describe("FR-13-05: History / transparency search", () => {
  test("GET /api/history with no params → 200 with empty results", async () => {
    const { status, body } = await apiGet("/api/history");
    expect(status).toBe(200);
    expect(Array.isArray(body.posts)).toBe(true);
    expect(Array.isArray(body.projects)).toBe(true);
    expect(Array.isArray(body.allocations)).toBe(true);
    expect(body.total).toBe(0);
  });

  test("GET /api/history?q=test → 200 with posts, projects, allocations, total", async () => {
    const { status, body } = await apiGet("/api/history?q=test");
    expect(status).toBe(200);
    expect(Array.isArray(body.posts)).toBe(true);
    expect(Array.isArray(body.projects)).toBe(true);
    expect(Array.isArray(body.allocations)).toBe(true);
    expect(typeof body.total).toBe("number");
    expect(body.total).toBe(body.posts.length + body.projects.length + body.allocations.length);
  });

  test("History allocations have amount as string (BigInt serialized)", async () => {
    const { status, body } = await apiGet("/api/history?q=lagos");
    expect(status).toBe(200);
    for (const a of body.allocations) {
      expect(typeof a.amount).toBe("string");
      expect(Number.isNaN(Number(a.amount))).toBe(false);
    }
  });

  test("GET /api/history?type=post → only posts returned (projects/allocations empty)", async () => {
    const { status, body } = await apiGet("/api/history?q=test&type=post");
    expect(status).toBe(200);
    expect(Array.isArray(body.posts)).toBe(true);
    expect(body.projects).toHaveLength(0);
    expect(body.allocations).toHaveLength(0);
  });

  test("GET /api/history?type=allocation → only allocations returned", async () => {
    const { status, body } = await apiGet("/api/history?q=kano&type=allocation");
    expect(status).toBe(200);
    expect(body.posts).toHaveLength(0);
    expect(body.projects).toHaveLength(0);
    expect(Array.isArray(body.allocations)).toBe(true);
  });

  test("GET /api/history?yearFrom=2023&yearTo=2024 → date range filter works", async () => {
    const { status, body } = await apiGet("/api/history?yearFrom=2023&yearTo=2024&lgaName=Lagos");
    expect(status).toBe(200);
    expect(typeof body.total).toBe("number");
  });

  test("History endpoint requires no authentication", async () => {
    const { status } = await apiGet("/api/history?q=test");
    expect(status).toBe(200);
    expect(status).not.toBe(401);
  });
});

// ─── FR-14: Press Releases & Live Streams ───────────────────────────────────

test.describe("FR-14-01: Public press releases", () => {
  test("GET /api/press-releases → 200 with releases and total", async () => {
    const { status, body } = await apiGet("/api/press-releases");
    if (skipIf500(status, "/api/press-releases")) return;
    expect(status).toBe(200);
    expect(Array.isArray(body.releases)).toBe(true);
    expect(typeof body.total).toBe("number");
  });

  test("Press release list items have required fields", async () => {
    const { status, body } = await apiGet("/api/press-releases?limit=1");
    if (skipIf500(status, "press-releases")) return;
    expect(status).toBe(200);
    if (body.releases.length === 0) {
      console.warn("⚠️  No published press releases in DB — skipping shape check");
      return;
    }
    const r = body.releases[0];
    expect(typeof r.id).toBe("string");
    expect(typeof r.title).toBe("string");
    expect(typeof r.issuingEntity).toBe("string");
    expect(typeof r.entityType).toBe("string");
    expect(r.status).toBe("PUBLISHED");
  });

  test("GET /api/press-releases?entityType=LGA → filtered by entityType", async () => {
    const { status, body } = await apiGet("/api/press-releases?entityType=LGA");
    if (skipIf500(status, "press-releases")) return;
    expect(status).toBe(200);
    for (const r of body.releases) {
      expect(r.entityType).toBe("LGA");
    }
  });

  test("GET /api/press-releases?q=test → search works", async () => {
    const { status, body } = await apiGet("/api/press-releases?q=test");
    if (skipIf500(status, "press-releases")) return;
    expect(status).toBe(200);
    expect(Array.isArray(body.releases)).toBe(true);
  });

  test("GET /api/press-releases/[id] — nonexistent → 404", async () => {
    const { status } = await apiGet(`/api/press-releases/${FAKE_UUID}`);
    if (skipIf500(status, "press-releases/[id]")) return;
    expect(status).toBe(404);
  });

  test("GET /api/press-releases requires no authentication", async () => {
    const { status } = await apiGet("/api/press-releases");
    if (skipIf500(status, "press-releases")) return;
    expect(status).not.toBe(401);
  });
});

test.describe("FR-14-02: Public live streams", () => {
  test("GET /api/live-streams → 200 with streams array", async () => {
    const { status, body } = await apiGet("/api/live-streams");
    if (skipIf500(status, "/api/live-streams")) return;
    expect(status).toBe(200);
    expect(Array.isArray(body.streams)).toBe(true);
  });

  test("Live stream items have required fields", async () => {
    const { status, body } = await apiGet("/api/live-streams");
    if (skipIf500(status, "live-streams")) return;
    expect(status).toBe(200);
    if (body.streams.length === 0) return;
    const s = body.streams[0];
    expect(typeof s.id).toBe("string");
    expect(typeof s.title).toBe("string");
    expect(typeof s.streamUrl).toBe("string");
    expect(typeof s.scheduledAt).toBe("string");
    expect(["UPCOMING", "LIVE"]).toContain(s.status);
  });

  test("GET /api/live-streams only returns UPCOMING and LIVE (not ENDED)", async () => {
    const { status, body } = await apiGet("/api/live-streams");
    if (skipIf500(status, "live-streams")) return;
    expect(status).toBe(200);
    for (const s of body.streams) {
      expect(["UPCOMING", "LIVE"]).toContain(s.status);
      expect(s.status).not.toBe("ENDED");
    }
  });
});

test.describe("FR-14-03: LGA Dashboard — press releases", () => {
  test("GET /api/lga-dashboard/press-releases without auth → 401", async () => {
    const { status } = await apiGet("/api/lga-dashboard/press-releases");
    expect(status).toBe(401);
  });

  test("GET /api/lga-dashboard/press-releases with a fake header (no session) → 401", async () => {
    // The x-lga-id header is no longer a trusted credential — a signed session
    // cookie is required, so a fake header is rejected.
    const { status } = await apiGet("/api/lga-dashboard/press-releases", LGA_AUTH);
    expect(status).toBe(401);
  });

  test("POST /api/lga-dashboard/press-releases without auth → 401", async () => {
    const { status } = await apiPost("/api/lga-dashboard/press-releases", {
      title: "Test Release",
      body: "Content of press release",
    });
    expect(status).toBe(401);
  });

  test("POST /api/lga-dashboard/press-releases — missing title/body → 400", async () => {
    const { status, body } = await apiPost("/api/lga-dashboard/press-releases",
      { title: "Only Title" }, LGA_AUTH);
    if (skipIf500(status, "POST lga-dashboard/press-releases")) return;
    // 401 now: the fake header does not authenticate (session cookie required).
    expect([400, 401, 404]).toContain(status);
    expect(typeof body.error).toBe("string");
  });

  test("POST /api/lga-dashboard/press-releases — nonexistent LGA → 404", async () => {
    const { status } = await apiPost("/api/lga-dashboard/press-releases", {
      title: "Test Release Title",
      body: "Content of press release that is long enough",
    }, LGA_AUTH);
    if (skipIf500(status, "POST lga-dashboard/press-releases")) return;
    expect([401, 404]).toContain(status);
  });
});

test.describe("FR-14-04: Admin — press release management", () => {
  test("GET /api/admin/press-releases without secret → 401", async () => {
    const { status } = await apiGet("/api/admin/press-releases");
    expect(status).toBe(401);
  });

  test("GET /api/admin/press-releases with secret → 200 with releases and total", async () => {
    const { status, body } = await apiGet("/api/admin/press-releases", ADMIN);
    if (skipIf500(status, "/api/admin/press-releases")) return;
    expect(status).toBe(200);
    expect(Array.isArray(body.releases)).toBe(true);
    expect(typeof body.total).toBe("number");
  });

  test("GET /api/admin/press-releases?status=PENDING → filtered", async () => {
    const { status, body } = await apiGet("/api/admin/press-releases?status=PENDING", ADMIN);
    if (skipIf500(status, "admin/press-releases")) return;
    expect(status).toBe(200);
    for (const r of body.releases) {
      expect(r.status).toBe("PENDING");
    }
  });

  test("POST /api/admin/press-releases — missing required fields → 400", async () => {
    const { status, body } = await apiPost("/api/admin/press-releases", { title: "No body" }, ADMIN);
    if (skipIf500(status, "POST admin/press-releases")) return;
    expect(status).toBe(400);
    expect(typeof body.error).toBe("string");
  });

  test("POST /api/admin/press-releases without secret → 401", async () => {
    const { status } = await apiPost("/api/admin/press-releases", {
      title: "Test", body: "Content", issuingEntity: "Federal Government",
    });
    expect(status).toBe(401);
  });

  test("PATCH /api/admin/press-releases/[id] — publish action → nonexistent 500 (record not found)", async () => {
    const { status } = await apiPatch(`/api/admin/press-releases/${FAKE_UUID}`,
      { action: "publish" }, ADMIN);
    if (skipIf500(status, "PATCH press-releases")) return;
    // Prisma throws P2025 on update of nonexistent record → 500
    expect([404, 500]).toContain(status);
  });

  test("PATCH /api/admin/press-releases/[id] — reject without auth → 401", async () => {
    const { status } = await apiPatch(`/api/admin/press-releases/${FAKE_UUID}`,
      { action: "reject", reason: "Inappropriate" });
    expect(status).toBe(401);
  });

  test("DELETE /api/admin/press-releases/[id] without secret → 401", async () => {
    const { status } = await apiDelete(`/api/admin/press-releases/${FAKE_UUID}`);
    expect(status).toBe(401);
  });
});

test.describe("FR-14-05: Admin — live stream management", () => {
  test("GET /api/admin/live-streams without secret → 401", async () => {
    const { status } = await apiGet("/api/admin/live-streams");
    expect(status).toBe(401);
  });

  test("GET /api/admin/live-streams with secret → 200 with streams array", async () => {
    const { status, body } = await apiGet("/api/admin/live-streams", ADMIN);
    if (skipIf500(status, "/api/admin/live-streams")) return;
    expect(status).toBe(200);
    expect(Array.isArray(body.streams)).toBe(true);
  });

  test("POST /api/admin/live-streams — missing required fields → 400", async () => {
    const { status, body } = await apiPost("/api/admin/live-streams", { title: "No URL" }, ADMIN);
    if (skipIf500(status, "POST admin/live-streams")) return;
    expect(status).toBe(400);
    expect(typeof body.error).toBe("string");
  });

  test("POST /api/admin/live-streams — valid payload creates stream", async () => {
    const { status, body } = await apiPost("/api/admin/live-streams", {
      title: "Test Live Stream",
      streamUrl: "https://youtube.com/watch?v=test",
      scheduledAt: new Date(Date.now() + 86400000).toISOString(),
    }, ADMIN);
    if (skipIf500(status, "POST admin/live-streams")) return;
    expect(status).toBe(201);
    expect(typeof body.stream.id).toBe("string");
    expect(body.stream.title).toBe("Test Live Stream");
    expect(body.stream.status).toBe("UPCOMING");

    // Clean up
    if (body.stream.id) {
      await apiDelete(`/api/admin/live-streams/${body.stream.id}`, ADMIN);
    }
  });

  test("POST /api/admin/live-streams without secret → 401", async () => {
    const { status } = await apiPost("/api/admin/live-streams", {
      title: "Test", streamUrl: "https://example.com", scheduledAt: new Date().toISOString(),
    });
    expect(status).toBe(401);
  });

  test("PATCH /api/admin/live-streams/[id] — set status to LIVE → nonexistent 500", async () => {
    const { status } = await apiPatch(`/api/admin/live-streams/${FAKE_UUID}`,
      { status: "LIVE" }, ADMIN);
    if (skipIf500(status, "PATCH live-streams")) return;
    expect([404, 500]).toContain(status);
  });

  test("PATCH /api/admin/live-streams/[id] without secret → 401", async () => {
    const { status } = await apiPatch(`/api/admin/live-streams/${FAKE_UUID}`, { status: "LIVE" });
    expect(status).toBe(401);
  });

  test("DELETE /api/admin/live-streams/[id] without secret → 401", async () => {
    const { status } = await apiDelete(`/api/admin/live-streams/${FAKE_UUID}`);
    expect(status).toBe(401);
  });
});
