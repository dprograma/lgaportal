import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAdminRequest } from "@/lib/admin-auth";

function csvEscape(v: unknown): string {
  const s = v === null || v === undefined ? "" : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

const COLUMNS = [
  "lgaName", "state", "wardName", "wardNumber",
  "councillorName", "councillorEmail", "councillorPhone", "population", "description",
] as const;

// GET /api/admin/wards/export — download existing ward records as CSV, ready
// to be edited and re-uploaded via POST /api/admin/wards. Pass ?id=<wardId>
// for a single-record CSV (one row) instead of the filtered bulk export.
export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id    = searchParams.get("id") ?? undefined;
  const state = searchParams.get("state") ?? undefined;

  const wards = await db.ward.findMany({
    where: id ? { id } : state ? { lga: { state: { equals: state, mode: "insensitive" } } } : {},
    include: { lga: { select: { lgaName: true, state: true } } },
    orderBy: [{ lga: { state: "asc" } }, { lga: { lgaName: "asc" } }, { wardNumber: "asc" }],
    take: id ? 1 : 5000,
  });

  if (id && wards.length === 0) {
    return NextResponse.json({ error: "Ward not found." }, { status: 404 });
  }

  const rows = wards.map((w) => ({
    lgaName: w.lga.lgaName, state: w.lga.state, wardName: w.wardName, wardNumber: w.wardNumber,
    councillorName: w.councillorName, councillorEmail: w.councillorEmail, councillorPhone: w.councillorPhone,
    population: w.population, description: w.description,
  }));

  const lines = [
    COLUMNS.join(","),
    ...rows.map((r) => COLUMNS.map((c) => csvEscape(r[c])).join(",")),
  ];

  const filename = id
    ? `ward-${rows[0].wardName.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.csv`
    : `ward-records-${new Date().toISOString().split("T")[0]}.csv`;

  return new NextResponse(lines.join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
