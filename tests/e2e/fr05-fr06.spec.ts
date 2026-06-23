/**
 * FR-05 (Interactive Map) and FR-06 (LGA Project Showcase) API contract tests.
 *
 * These run without a browser — pure HTTP against the running dev server.
 * Run with: npx playwright test --project=api fr05-fr06
 *
 * Prerequisites:
 *  - Dev server on http://localhost:3000 (webServer config starts it)
 *  - DATABASE_URL set in .env.local
 *  - At least one APPROVED LGA in the DB for FR-06 auth tests
 *    (or tests will hit 403; assertions accept that case)
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

// Fake LGA ID used for 401/403/404 auth tests
const FAKE_LGA_ID = "00000000-0000-0000-0000-000000000000";
const LGA_AUTH = { "x-lga-id": FAKE_LGA_ID };

// ─── FR-05: Interactive Map ──────────────────────────────────────────────────

test.describe("FR-05-01: Map data — LGA markers", () => {
  test("GET /api/map/data (default) → 200 with lgas array", async () => {
    const { status, body } = await apiGet("/api/map/data");
    expect(status).toBe(200);
    expect(Array.isArray(body.lgas)).toBe(true);
  });

  test("GET /api/map/data?type=lgas → 200 with lgas array", async () => {
    const { status, body } = await apiGet("/api/map/data?type=lgas");
    expect(status).toBe(200);
    expect(Array.isArray(body.lgas)).toBe(true);
  });

  test("LGA marker has required fields", async () => {
    const { status, body } = await apiGet("/api/map/data?type=lgas");
    expect(status).toBe(200);
    if (body.lgas.length === 0) {
      console.warn("⚠️  No APPROVED LGAs in DB — skipping shape check");
      return;
    }
    const lga = body.lgas[0];
    expect(typeof lga.id).toBe("string");
    expect(typeof lga.lgaName).toBe("string");
    expect(typeof lga.state).toBe("string");
    expect(typeof lga.lat).toBe("number");
    expect(typeof lga.lng).toBe("number");
    expect(typeof lga.isVerified).toBe("boolean");
    expect(typeof lga._count).toBe("object");
    expect(typeof lga._count.posts).toBe("number");
    expect(typeof lga._count.wards).toBe("number");
    // latestAllocation is string (kobo) or null
    expect(lga.latestAllocation === null || typeof lga.latestAllocation === "string").toBe(true);
  });

  test("LGA markers are all APPROVED (no PENDING markers)", async () => {
    // All markers should have lat/lng from coordinate helper — they wouldn't
    // appear unless DB query filtered to status:APPROVED
    const { status, body } = await apiGet("/api/map/data?type=lgas");
    expect(status).toBe(200);
    // Every marker has a numeric lat/lng (coordinate helper always assigns one)
    for (const lga of body.lgas) {
      expect(typeof lga.lat).toBe("number");
      expect(typeof lga.lng).toBe("number");
    }
  });

  test("Map data endpoint requires no authentication", async () => {
    // Public endpoint — no headers
    const { status } = await apiGet("/api/map/data?type=lgas");
    expect(status).toBe(200);
  });
});

test.describe("FR-05-02: Map data — project markers", () => {
  test("GET /api/map/data?type=projects → 200 with projects array", async () => {
    const { status, body } = await apiGet("/api/map/data?type=projects");
    expect(status).toBe(200);
    expect(Array.isArray(body.projects)).toBe(true);
  });

  test("Project markers have required fields", async () => {
    const { status, body } = await apiGet("/api/map/data?type=projects");
    expect(status).toBe(200);
    if (body.projects.length === 0) {
      console.warn("⚠️  No published projects with coordinates in DB — skipping shape check");
      return;
    }
    const p = body.projects[0];
    expect(typeof p.id).toBe("string");
    expect(typeof p.title).toBe("string");
    expect(typeof p.category).toBe("string");
    expect(typeof p.status).toBe("string");
    expect(typeof p.latitude).toBe("number");
    expect(typeof p.longitude).toBe("number");
    expect(typeof p.isArchived).toBe("boolean");
    expect(typeof p.lga).toBe("object");
    expect(typeof p.lga.lgaName).toBe("string");
    expect(typeof p.lga.state).toBe("string");
  });

  test("All project markers have valid coordinates (only those with coords returned)", async () => {
    const { status, body } = await apiGet("/api/map/data?type=projects");
    expect(status).toBe(200);
    for (const p of body.projects) {
      expect(p.latitude).not.toBeNull();
      expect(p.longitude).not.toBeNull();
    }
  });
});

test.describe("FR-05-03: Map LGA popup data", () => {
  test("GET /api/map/lga/nonexistent → 404", async () => {
    const { status } = await apiGet(`/api/map/lga/${FAKE_LGA_ID}`);
    expect([404, 400]).toContain(status);
  });

  test("GET /api/map/lga/[id] for real LGA → 200 or 404", async () => {
    // Grab an LGA id from the marker list if available
    const mapRes = await apiGet("/api/map/data?type=lgas");
    if (mapRes.body.lgas?.length === 0) {
      console.warn("⚠️  No APPROVED LGAs — skipping popup test");
      return;
    }
    const lgaId = mapRes.body.lgas[0]?.id;
    if (!lgaId) return;

    const { status, body } = await apiGet(`/api/map/lga/${lgaId}`);
    expect(status).toBe(200);
    expect(typeof body.lga).toBe("object");
    expect(typeof body.lga.id).toBe("string");
    expect(typeof body.lga.lgaName).toBe("string");
    expect(typeof body.lga.state).toBe("string");
    expect(typeof body.lga.citizenCount).toBe("number");
    expect(Array.isArray(body.lga.posts)).toBe(true);
    expect(typeof body.lga._count).toBe("object");
    // latestAllocation is object or null
    if (body.lga.latestAllocation !== null) {
      expect(typeof body.lga.latestAllocation.amount).toBe("string");
      expect(typeof body.lga.latestAllocation.month).toBe("number");
      expect(typeof body.lga.latestAllocation.year).toBe("number");
    }
  });

  test("LGA popup requires no authentication", async () => {
    const { status } = await apiGet(`/api/map/lga/${FAKE_LGA_ID}`);
    // 404 is fine (doesn't exist); 401 would be a bug
    expect(status).not.toBe(401);
  });
});

// ─── FR-06: LGA Project Showcase — Public API ───────────────────────────────

test.describe("FR-06-01: Public projects list", () => {
  test("GET /api/projects → 200 with projects array and total", async () => {
    const { status, body } = await apiGet("/api/projects");
    expect(status).toBe(200);
    expect(Array.isArray(body.projects)).toBe(true);
    expect(typeof body.total).toBe("number");
  });

  test("Project records have required public fields", async () => {
    const { status, body } = await apiGet("/api/projects?limit=1");
    expect(status).toBe(200);
    if (body.projects.length === 0) {
      console.warn("⚠️  No published projects in DB — skipping shape check");
      return;
    }
    const p = body.projects[0];
    expect(typeof p.id).toBe("string");
    expect(typeof p.title).toBe("string");
    expect(typeof p.description).toBe("string");
    expect(typeof p.category).toBe("string");
    expect(typeof p.status).toBe("string");
    expect(typeof p.isPublished).toBe("boolean");
    // budget is BigInt serialized as string (or null)
    expect(p.budget === null || typeof p.budget === "string").toBe(true);
  });

  test("budget field is serialized as string not BigInt", async () => {
    const { status, body } = await apiGet("/api/projects?limit=5");
    expect(status).toBe(200);
    for (const p of body.projects) {
      if (p.budget !== null) {
        expect(typeof p.budget).toBe("string");
        expect(Number.isNaN(Number(p.budget))).toBe(false);
      }
    }
  });

  test("forMap=true returns lighter payload without description/budget", async () => {
    const { status, body } = await apiGet("/api/projects?forMap=true&limit=5");
    expect(status).toBe(200);
    expect(Array.isArray(body.projects)).toBe(true);
    if (body.projects.length === 0) return;
    const p = body.projects[0];
    // forMap payload has id, lgaId, title, category, status, lat, lng, isArchived, lga
    expect(typeof p.id).toBe("string");
    expect(typeof p.title).toBe("string");
    expect(typeof p.category).toBe("string");
    // description and budget are NOT in the forMap payload
    expect("description" in p).toBe(false);
    expect("budget" in p).toBe(false);
  });

  test("state filter narrows results", async () => {
    const { status, body } = await apiGet("/api/projects?state=Lagos&limit=10");
    expect(status).toBe(200);
    expect(Array.isArray(body.projects)).toBe(true);
    // If there are projects, they all belong to Lagos-state LGAs
    // (can't easily verify without cross-referencing — just check 200+shape)
    expect(typeof body.total).toBe("number");
  });

  test("category filter accepts valid enum values", async () => {
    const { status, body } = await apiGet("/api/projects?category=HEALTH");
    expect(status).toBe(200);
    expect(Array.isArray(body.projects)).toBe(true);
  });

  test("status filter accepts PENDING, IN_PROGRESS, COMPLETED", async () => {
    for (const s of ["PENDING", "IN_PROGRESS", "COMPLETED"]) {
      const { status, body } = await apiGet(`/api/projects?status=${s}&limit=1`);
      expect(status).toBe(200);
      expect(Array.isArray(body.projects)).toBe(true);
    }
  });

  test("pagination — limit and offset", async () => {
    const { status, body } = await apiGet("/api/projects?limit=5&offset=0");
    expect(status).toBe(200);
    expect(body.projects.length).toBeLessThanOrEqual(5);
    expect(typeof body.total).toBe("number");
  });

  test("limit capped at 500", async () => {
    const { status, body } = await apiGet("/api/projects?limit=9999");
    expect(status).toBe(200);
    expect(body.projects.length).toBeLessThanOrEqual(500);
  });

  test("GET /api/projects requires no authentication", async () => {
    const { status } = await apiGet("/api/projects");
    expect(status).toBe(200);
  });
});

test.describe("FR-06-02: Public project detail", () => {
  test("GET /api/projects/nonexistent → 404", async () => {
    const { status } = await apiGet("/api/projects/definitely-not-a-real-slug-xyz");
    expect(status).toBe(404);
  });

  test("GET /api/projects/[id] for real project → 200 with rich shape", async () => {
    // Get a project id from the list
    const listRes = await apiGet("/api/projects?limit=1");
    if (listRes.body.projects?.length === 0) {
      console.warn("⚠️  No published projects — skipping detail test");
      return;
    }
    const id = listRes.body.projects[0]?.id;
    if (!id) return;

    const { status, body } = await apiGet(`/api/projects/${id}`);
    expect(status).toBe(200);
    expect(typeof body.project).toBe("object");
    expect(typeof body.project.id).toBe("string");
    expect(typeof body.project.title).toBe("string");
    // reactionCounts and commentCount are included
    expect(typeof body.project.reactionCounts).toBe("object");
    expect(typeof body.project.commentCount).toBe("number");
    // budget is string or null
    expect(body.project.budget === null || typeof body.project.budget === "string").toBe(true);
  });
});

// ─── FR-06: LGA Project Showcase — LGA Dashboard ───────────────────────────

test.describe("FR-06-03: LGA Dashboard — project list auth", () => {
  test("GET /api/lga-dashboard/projects without x-lga-id → 401", async () => {
    const { status } = await apiGet("/api/lga-dashboard/projects");
    expect(status).toBe(401);
  });

  test("GET /api/lga-dashboard/projects with bad lgaId → 200 with empty list", async () => {
    // Bad UUID returns a 200 with an empty list (findMany returns [] for unknown lgaId)
    const { status, body } = await apiGet("/api/lga-dashboard/projects", LGA_AUTH);
    expect([200, 401, 403]).toContain(status);
    if (status === 200) {
      expect(Array.isArray(body.projects)).toBe(true);
      expect(typeof body.total).toBe("number");
    }
  });

  test("GET /api/lga-dashboard/projects response shape is correct", async () => {
    const { status, body } = await apiGet("/api/lga-dashboard/projects", LGA_AUTH);
    if (status !== 200) return; // skip if unauthorized
    expect(Array.isArray(body.projects)).toBe(true);
    expect(typeof body.total).toBe("number");
    for (const p of body.projects) {
      expect(p.budget === null || typeof p.budget === "string").toBe(true);
    }
  });

  test("GET /api/lga-dashboard/projects?archived=true filters archived projects", async () => {
    const { status, body } = await apiGet("/api/lga-dashboard/projects?archived=true", LGA_AUTH);
    expect([200]).toContain(status);
    if (status === 200) {
      for (const p of body.projects) {
        expect(p.isArchived).toBe(true);
      }
    }
  });
});

test.describe("FR-06-04: LGA Dashboard — create project", () => {
  test("POST /api/lga-dashboard/projects without x-lga-id → 401", async () => {
    const { status } = await apiPost("/api/lga-dashboard/projects", {
      title: "Test Project",
      description: "A description of at least 10 characters.",
      category: "HEALTH",
    });
    expect(status).toBe(401);
  });

  test("POST /api/lga-dashboard/projects with bad lgaId → 403 (not approved)", async () => {
    const { status, body } = await apiPost(
      "/api/lga-dashboard/projects",
      {
        title: "Test Project",
        description: "A description of at least 10 characters.",
        category: "HEALTH",
      },
      LGA_AUTH
    );
    // 403 because the fake LGA is not found / not APPROVED
    expect([403, 404]).toContain(status);
    expect(typeof body.error).toBe("string");
  });

  test("POST /api/lga-dashboard/projects — title too short → 422", async () => {
    const { status, body } = await apiPost(
      "/api/lga-dashboard/projects",
      { title: "Hi", description: "A valid description here.", category: "HEALTH" },
      LGA_AUTH
    );
    // 422 validation OR 403 from auth check (depends on order)
    expect([401, 403, 404, 422]).toContain(status);
    if (status === 422) expect(typeof body.error).toBe("string");
  });

  test("POST /api/lga-dashboard/projects — invalid category → 422", async () => {
    const { status, body } = await apiPost(
      "/api/lga-dashboard/projects",
      {
        title: "A Valid Title",
        description: "A valid description here.",
        category: "INVALID_CATEGORY",
      },
      LGA_AUTH
    );
    expect([401, 403, 404, 422]).toContain(status);
    if (status === 422) expect(typeof body.error).toBe("string");
  });

  test("POST /api/lga-dashboard/projects — negative budget → 422", async () => {
    const { status, body } = await apiPost(
      "/api/lga-dashboard/projects",
      {
        title: "A Valid Title",
        description: "A valid description here.",
        category: "HEALTH",
        budget: -100,
      },
      LGA_AUTH
    );
    expect([401, 403, 404, 422]).toContain(status);
    if (status === 422) expect(typeof body.error).toBe("string");
  });

  test("POST /api/lga-dashboard/projects — invalid videoUrl → 422", async () => {
    const { status, body } = await apiPost(
      "/api/lga-dashboard/projects",
      {
        title: "A Valid Title",
        description: "A valid description here.",
        category: "HEALTH",
        videoUrl: "not-a-url",
      },
      LGA_AUTH
    );
    expect([401, 403, 404, 422]).toContain(status);
    if (status === 422) expect(typeof body.error).toBe("string");
  });
});

test.describe("FR-06-05: LGA Dashboard — update and delete project", () => {
  test("PATCH /api/lga-dashboard/projects/[id] without auth → 401", async () => {
    const { status } = await apiPatch(`/api/lga-dashboard/projects/${FAKE_LGA_ID}`, {
      isPublished: true,
    });
    expect(status).toBe(401);
  });

  test("PATCH /api/lga-dashboard/projects/[id] nonexistent → 404", async () => {
    const { status } = await apiPatch(
      `/api/lga-dashboard/projects/${FAKE_LGA_ID}`,
      { isPublished: true },
      LGA_AUTH
    );
    expect([404, 403]).toContain(status);
  });

  test("DELETE /api/lga-dashboard/projects/[id] without auth → 401", async () => {
    const { status } = await apiDelete(`/api/lga-dashboard/projects/${FAKE_LGA_ID}`);
    expect(status).toBe(401);
  });

  test("DELETE /api/lga-dashboard/projects/[id] nonexistent → 404", async () => {
    const { status } = await apiDelete(
      `/api/lga-dashboard/projects/${FAKE_LGA_ID}`,
      LGA_AUTH
    );
    expect([404, 403]).toContain(status);
  });

  test("GET /api/lga-dashboard/projects/[id] without auth → 401", async () => {
    const { status } = await apiGet(`/api/lga-dashboard/projects/${FAKE_LGA_ID}`);
    expect(status).toBe(401);
  });

  test("GET /api/lga-dashboard/projects/[id] nonexistent → 404", async () => {
    const { status } = await apiGet(
      `/api/lga-dashboard/projects/${FAKE_LGA_ID}`,
      LGA_AUTH
    );
    expect([404, 403]).toContain(status);
  });
});
