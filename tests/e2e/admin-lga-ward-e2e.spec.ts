/**
 * API contract tests for admin's LGA-record and Ward-record management:
 *
 *   - LGA profile correction   (/api/admin/lgas/[id]      — single edit)
 *   - LGA bulk correction      (/api/admin/lgas/bulk-update — CSV round-trip)
 *   - LGA CSV export           (/api/admin/lgas/export)
 *   - Ward CRUD                (/api/admin/wards, /api/admin/wards/[id])
 *   - Ward CSV export          (/api/admin/wards/export)
 *
 * These endpoints exist so admin can correct an already-registered LGA's
 * official record (name, population, address, etc. — never login/auth
 * fields) and seed/manage ward data for any LGA, without ever creating a new
 * LGA (and therefore never creating a new login account) as a side effect.
 *
 * Run with:  npx playwright test --project=api admin-lga-ward-e2e
 */

import { test, expect, request as apiRequest, type APIRequestContext } from "@playwright/test";
import { Pool } from "pg";
import { config } from "dotenv";

config({ path: ".env.local" });

const BASE = "http://localhost:3000";
const PASSWORD = "Secure@123";
const uniq = () => `${Date.now()}${Math.floor(Math.random() * 1000)}`;

const RUN_OCTET = Math.floor(Math.random() * 254) + 1;
const ipFor = (role: number) => `198.28.${RUN_OCTET}.${role}`;

const ADMIN_SECRET = process.env.ADMIN_SECRET ?? process.env.NEXT_PUBLIC_ADMIN_SECRET ?? "";
const ADMIN = { "x-admin-secret": ADMIN_SECRET };

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

/** Register + verify + admin-approve an LGA; returns its id/email/name/state. */
async function seedApprovedLGA(ip: string): Promise<{ id: string; email: string; lgaName: string; state: string }> {
  const suffix = uniq();
  const lgaName = `Recordville ${suffix}`;
  const state = "Lagos";
  const email = `chairman_rec_${suffix}@example.com`;
  const ctx = await apiRequest.newContext({ baseURL: BASE, extraHTTPHeaders: { "x-forwarded-for": ip } });

  const reg = await ctx.post("/api/lga/register", {
    data: {
      lgaName, state, chairmanName: "Chief Record", email, phone: "08012345678",
      officeAddress: "1 Record Road, Ikeja", sectors: ["Health"],
      password: PASSWORD, confirmPassword: PASSWORD, terms: true,
    },
  });
  expect(reg.status(), "seed: LGA register").toBe(201);
  const { lgaId } = await reg.json();

  const ver = await ctx.post("/api/lga/verify", { data: { token: await chairmanToken(email) } });
  expect(ver.status(), "seed: LGA verify").toBe(200);

  const admin = await apiRequest.newContext({ baseURL: BASE });
  const approve = await admin.post(`/api/admin/lgas/${lgaId}/approve`, { headers: ADMIN });
  expect(approve.status(), "seed: admin approve").toBe(200);

  return { id: lgaId, email, lgaName, state };
}

// ─── LGA: single-record edit ──────────────────────────────────────────────────

test.describe("PATCH /api/admin/lgas/[id] — correct a single LGA's profile", () => {
  test("without the admin secret → 401", async () => {
    const c = await apiRequest.newContext({ baseURL: BASE });
    const res = await c.patch("/api/admin/lgas/some-id", { data: { population: "1000" } });
    expect(res.status()).toBe(401);
  });

  test("editing a nonexistent LGA → 404", async () => {
    const c = await apiRequest.newContext({ baseURL: BASE });
    const res = await c.patch("/api/admin/lgas/does-not-exist", { headers: ADMIN, data: { population: "1000" } });
    expect(res.status()).toBe(404);
  });

  test("corrects population/officeAddress/description without touching email", async () => {
    const lga = await seedApprovedLGA(ipFor(1));
    const c = await apiRequest.newContext({ baseURL: BASE });

    const res = await c.patch(`/api/admin/lgas/${lga.id}`, {
      headers: ADMIN,
      data: { population: "512000", officeAddress: "Corrected Secretariat Road", description: "Updated by admin review." },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.lga.population).toBe("512000");
    expect(body.lga.officeAddress).toBe("Corrected Secretariat Road");
    expect(body.lga.email).toBe(lga.email); // untouched

    const get = await c.get(`/api/admin/lgas/${lga.id}`, { headers: ADMIN });
    expect((await get.json()).lga.description).toBe("Updated by admin review.");
  });
});

// ─── LGA: bulk correction (CSV round-trip via JSON rows) ─────────────────────

test.describe("POST /api/admin/lgas/bulk-update — correct many LGAs at once", () => {
  test("without the admin secret → 401", async () => {
    const c = await apiRequest.newContext({ baseURL: BASE });
    const res = await c.post("/api/admin/lgas/bulk-update", { data: [] });
    expect(res.status()).toBe(401);
  });

  test("a row with neither email nor lgaName+state → 422", async () => {
    const c = await apiRequest.newContext({ baseURL: BASE });
    const res = await c.post("/api/admin/lgas/bulk-update", { headers: ADMIN, data: [{ population: "1" }] });
    expect(res.status()).toBe(422);
  });

  test("updates matching rows by email, skips unmatched rows, never creates new LGAs", async () => {
    const lga = await seedApprovedLGA(ipFor(2));
    const c = await apiRequest.newContext({ baseURL: BASE });

    const res = await c.post("/api/admin/lgas/bulk-update", {
      headers: ADMIN,
      data: [
        { email: lga.email, population: "999999", phone: "08099999999" },
        { email: "no-such-lga@example.com", population: "1" },
      ],
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.updated).toBe(1);
    expect(body.total).toBe(2);
    expect(body.skipped).toHaveLength(1);
    expect(body.skipped[0].reason).toMatch(/no matching registered lga/i);

    const get = await c.get(`/api/admin/lgas/${lga.id}`, { headers: ADMIN });
    expect((await get.json()).lga.population).toBe("999999");

    const totalLgasWithThatFakeEmail = await pool.query(`SELECT count(*)::int AS n FROM lgas WHERE email = $1`, ["no-such-lga@example.com"]);
    expect(totalLgasWithThatFakeEmail.rows[0].n, "bulk-update must never create a new LGA row").toBe(0);
  });

  test("matches by lgaName+state when no email is given", async () => {
    const lga = await seedApprovedLGA(ipFor(3));
    const c = await apiRequest.newContext({ baseURL: BASE });

    const res = await c.post("/api/admin/lgas/bulk-update", {
      headers: ADMIN,
      data: [{ lgaName: lga.lgaName, state: lga.state, description: "Matched by name+state." }],
    });
    expect(res.status()).toBe(200);
    expect((await res.json()).updated).toBe(1);

    const get = await c.get(`/api/admin/lgas/${lga.id}`, { headers: ADMIN });
    expect((await get.json()).lga.description).toBe("Matched by name+state.");
  });
});

// ─── LGA: CSV export ──────────────────────────────────────────────────────────

test.describe("GET /api/admin/lgas/export", () => {
  test("without the admin secret → 401", async () => {
    const c = await apiRequest.newContext({ baseURL: BASE });
    expect((await c.get("/api/admin/lgas/export")).status()).toBe(401);
  });

  test("returns CSV including the seeded LGA, in a shape bulk-update accepts back", async () => {
    const lga = await seedApprovedLGA(ipFor(4));
    const c = await apiRequest.newContext({ baseURL: BASE });
    const res = await c.get(`/api/admin/lgas/export?search=${encodeURIComponent(lga.lgaName)}`, { headers: ADMIN });
    expect(res.status()).toBe(200);
    expect(res.headers()["content-type"]).toContain("text/csv");
    const text = await res.text();
    expect(text).toContain("email,lgaName,state");
    expect(text).toContain(lga.email);
  });
});

// ─── Ward: create (single + bulk) ────────────────────────────────────────────

test.describe("POST /api/admin/wards", () => {
  test("without the admin secret → 401", async () => {
    const c = await apiRequest.newContext({ baseURL: BASE });
    const res = await c.post("/api/admin/wards", { data: { lgaName: "X", state: "Y", wardName: "Z", councillorName: "W" } });
    expect(res.status()).toBe(401);
  });

  test("creates a single ward for an existing LGA → 201", async () => {
    const lga = await seedApprovedLGA(ipFor(5));
    const c = await apiRequest.newContext({ baseURL: BASE });
    const res = await c.post("/api/admin/wards", {
      headers: ADMIN,
      data: { lgaName: lga.lgaName, state: lga.state, wardName: "Central Ward", councillorName: "Cllr Central" },
    });
    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body.created).toBe(1);
    expect(body.skipped).toHaveLength(0);
  });

  test("bulk-creates wards, skipping rows for LGAs that don't exist", async () => {
    const lga = await seedApprovedLGA(ipFor(6));
    const c = await apiRequest.newContext({ baseURL: BASE });
    const res = await c.post("/api/admin/wards", {
      headers: ADMIN,
      data: [
        { lgaName: lga.lgaName, state: lga.state, wardName: "Ward A", councillorName: "Cllr A" },
        { lgaName: lga.lgaName, state: lga.state, wardName: "Ward B", councillorName: "Cllr B" },
        { lgaName: "Totally Made Up LGA", state: "Lagos", wardName: "Ward Z", councillorName: "Cllr Z" },
      ],
    });
    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body.created).toBe(2);
    expect(body.total).toBe(3);
    expect(body.skipped).toHaveLength(1);
    expect(body.skipped[0].reason).toMatch(/no registered lga/i);
  });

  test("re-uploading the same ward (same LGA + wardName) upserts instead of duplicating", async () => {
    const lga = await seedApprovedLGA(ipFor(7));
    const c = await apiRequest.newContext({ baseURL: BASE });
    await c.post("/api/admin/wards", {
      headers: ADMIN,
      data: { lgaName: lga.lgaName, state: lga.state, wardName: "Repeat Ward", councillorName: "Cllr One" },
    });
    const res = await c.post("/api/admin/wards", {
      headers: ADMIN,
      data: { lgaName: lga.lgaName, state: lga.state, wardName: "Repeat Ward", councillorName: "Cllr Two (corrected)" },
    });
    expect(res.status()).toBe(201);

    const { rows } = await pool.query(
      `SELECT count(*)::int AS n, (array_agg("councillorName"))[1] AS name FROM wards WHERE "lgaId" = $1 AND "wardName" = 'Repeat Ward'`,
      [lga.id]
    );
    expect(rows[0].n, "must upsert, not duplicate").toBe(1);
    expect(rows[0].name).toBe("Cllr Two (corrected)");
  });
});

// ─── Ward: list / edit / delete / export ─────────────────────────────────────

test.describe("Ward record lifecycle — list, edit, delete, export", () => {
  test("GET /api/admin/wards without the admin secret → 401", async () => {
    const c = await apiRequest.newContext({ baseURL: BASE });
    expect((await c.get("/api/admin/wards")).status()).toBe(401);
  });

  test("list, edit, and delete a ward end-to-end", async () => {
    const lga = await seedApprovedLGA(ipFor(8));
    const c = await apiRequest.newContext({ baseURL: BASE });

    const create = await c.post("/api/admin/wards", {
      headers: ADMIN,
      data: { lgaName: lga.lgaName, state: lga.state, wardName: "Lifecycle Ward", councillorName: "Cllr Original" },
    });
    expect(create.status()).toBe(201);

    const list = await c.get(`/api/admin/wards?search=${encodeURIComponent(lga.lgaName)}`, { headers: ADMIN });
    expect(list.status()).toBe(200);
    const listBody = await list.json();
    const ward = listBody.wards.find((w: { wardName: string }) => w.wardName === "Lifecycle Ward");
    expect(ward, "the created ward is listed with its LGA joined in").toBeTruthy();
    expect(ward.lga.lgaName).toBe(lga.lgaName);

    const edit = await c.patch(`/api/admin/wards/${ward.id}`, { headers: ADMIN, data: { councillorName: "Cllr Renamed" } });
    expect(edit.status()).toBe(200);
    expect((await edit.json()).ward.councillorName).toBe("Cllr Renamed");

    const del = await c.delete(`/api/admin/wards/${ward.id}`, { headers: ADMIN });
    expect(del.status()).toBe(200);

    const editAfterDelete = await c.patch(`/api/admin/wards/${ward.id}`, { headers: ADMIN, data: { councillorName: "No Longer Exists" } });
    expect(editAfterDelete.status()).toBe(404);
  });

  test("GET /api/admin/wards/export returns CSV including a created ward", async () => {
    const lga = await seedApprovedLGA(ipFor(9));
    const c = await apiRequest.newContext({ baseURL: BASE });
    await c.post("/api/admin/wards", {
      headers: ADMIN,
      data: { lgaName: lga.lgaName, state: lga.state, wardName: "Export Ward", councillorName: "Cllr Export" },
    });

    const res = await c.get("/api/admin/wards/export", { headers: ADMIN });
    expect(res.status()).toBe(200);
    expect(res.headers()["content-type"]).toContain("text/csv");
    const text = await res.text();
    expect(text).toContain(lga.lgaName);
    expect(text).toContain("Export Ward");
  });
});
