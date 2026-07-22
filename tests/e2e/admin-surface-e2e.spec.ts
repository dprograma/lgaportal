/**
 * API contract tests for the ADMIN surface — verifies each admin read endpoint
 * is auth-gated (rejects requests without the admin secret) and returns its
 * documented shape when authenticated.
 *
 * Run with:  npx playwright test --project=api admin-surface-e2e
 *
 * Requires ADMIN_SECRET (or NEXT_PUBLIC_ADMIN_SECRET) in .env.local.
 */

import { test, expect, request as apiRequest } from "@playwright/test";
import { config } from "dotenv";
import { readFileSync } from "fs";
import path from "path";
import { extractAllocationRows } from "../../lib/pdf-table-extract";

config({ path: ".env.local" });

const BASE = "http://localhost:3000";
const SECRET = process.env.ADMIN_SECRET ?? process.env.NEXT_PUBLIC_ADMIN_SECRET ?? "";
const ADMIN = { "x-admin-secret": SECRET };

async function get(path: string, headers: Record<string, string> = {}) {
  const ctx = await apiRequest.newContext({ baseURL: BASE });
  const res = await ctx.get(path, { headers });
  const body = await res.json().catch(() => ({}));
  return { status: res.status(), body };
}

async function post(path: string, data: unknown, headers: Record<string, string> = {}) {
  const ctx = await apiRequest.newContext({ baseURL: BASE });
  const res = await ctx.post(path, { headers, data });
  const body = await res.json().catch(() => ({}));
  return { status: res.status(), body };
}

// endpoint → a key expected in the authenticated response
const ADMIN_GETS: Array<{ path: string; key: string }> = [
  { path: "/api/admin/analytics",     key: "lgas" },
  { path: "/api/admin/revenue",       key: "totalRevenue" },
  { path: "/api/admin/reports",       key: "reports" },
  { path: "/api/admin/moderation",    key: "pendingReports" },
  { path: "/api/admin/users",         key: "users" },
  { path: "/api/admin/allocations",   key: "records" },
  { path: "/api/admin/audit-reports", key: "reports" },
  { path: "/api/admin/live-streams",  key: "streams" },
  { path: "/api/admin/ad-plans",      key: "plans" },
  { path: "/api/admin/lgas/expiring", key: "expiring" },
];

test.describe("Admin surface — auth gating", () => {
  for (const { path } of ADMIN_GETS) {
    test(`${path} without the admin secret is rejected (401/403)`, async () => {
      const { status } = await get(path);
      expect([401, 403]).toContain(status);
    });
  }

  test("a wrong admin secret is rejected (401/403)", async () => {
    const { status } = await get("/api/admin/users", { "x-admin-secret": "totally-wrong" });
    expect([401, 403]).toContain(status);
  });
});

test.describe("Admin surface — authenticated shape", () => {
  test.skip(!SECRET, "ADMIN_SECRET not set");

  for (const { path, key } of ADMIN_GETS) {
    test(`${path} with the admin secret → 200 including "${key}"`, async () => {
      const { status, body } = await get(path, ADMIN);
      expect(status).toBe(200);
      expect(key in body).toBe(true);
    });
  }
});

// ─── Admin upload / PDF-import surface ───────────────────────────────────────
// Backs the "Import from PDF" flow on /admin/allocations: admin uploads a
// FAAC disbursement PDF straight to Cloudinary via a signed URL (so it never
// passes through this server's own request body), then this server fetches
// it back out-of-band and extracts rows for review before import.

test.describe("POST /api/admin/uploads/signature", () => {
  test("without the admin secret → 401", async () => {
    const { status } = await post("/api/admin/uploads/signature", {});
    expect(status).toBe(401);
  });

  test("with the admin secret, Cloudinary unconfigured in this environment → 503", async () => {
    test.skip(!SECRET, "ADMIN_SECRET not set");
    test.skip(!!process.env.CLOUDINARY_CLOUD_NAME, "Cloudinary is configured in this environment");
    const { status, body } = await post("/api/admin/uploads/signature", {}, ADMIN);
    expect(status).toBe(503);
    expect(body.error).toMatch(/not configured/i);
  });
});

test.describe("POST /api/admin/allocations/pdf-extract", () => {
  test("without the admin secret → 401", async () => {
    const { status } = await post("/api/admin/allocations/pdf-extract", { pdfUrl: "https://res.cloudinary.com/x/y.pdf" });
    expect(status).toBe(401);
  });

  test("a pdfUrl that isn't a Cloudinary URL → 400", async () => {
    test.skip(!SECRET, "ADMIN_SECRET not set");
    const { status, body } = await post("/api/admin/allocations/pdf-extract", { pdfUrl: "https://evil.example.com/not-cloudinary.pdf" }, ADMIN);
    expect(status).toBe(400);
    expect(body.error).toMatch(/cloudinary/i);
  });

  test("a missing pdfUrl → 400", async () => {
    test.skip(!SECRET, "ADMIN_SECRET not set");
    const { status } = await post("/api/admin/allocations/pdf-extract", {}, ADMIN);
    expect(status).toBe(400);
  });
});

// ─── PDF table extraction — direct, no HTTP/Cloudinary involved ─────────────
// Exercises the actual row-reconstruction logic (position grouping, state-
// header detection, amount parsing) against a fixture PDF shaped like a real
// FAAC disbursement report (state header rows followed by LGA + amount rows).

test.describe("extractAllocationRows — PDF table extraction", () => {
  test("reconstructs LGA/state/amount rows from a FAAC-shaped PDF", async () => {
    const fixture = readFileSync(path.join(__dirname, "..", "fixtures", "faac-sample.pdf"));
    const rows = await extractAllocationRows(fixture);

    expect(rows).toHaveLength(5);

    const agege = rows.find((r) => r.name === "Agege");
    expect(agege?.state).toBe("LAGOS");
    expect(agege?.amount).toBe(123456789);

    const ijebuOde = rows.find((r) => r.name === "Ijebu Ode");
    expect(ijebuOde?.state).toBe("OGUN");
    expect(ijebuOde?.amount).toBe(145300250.75);

    // Every row must have picked up a state from the header above it.
    expect(rows.every((r) => r.state !== null)).toBe(true);
  });
});
