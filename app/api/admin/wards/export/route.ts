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
// to be edited and re-uploaded via POST /api/admin/wards.
export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const state = searchParams.get("state") ?? undefined;

  const wards = await db.ward.findMany({
    where: state ? { lga: { state: { equals: state, mode: "insensitive" } } } : {},
    include: { lga: { select: { lgaName: true, state: true } } },
    orderBy: [{ lga: { state: "asc" } }, { lga: { lgaName: "asc" } }, { wardNumber: "asc" }],
    take: 5000,
  });

  const rows = wards.map((w) => ({
    lgaName: w.lga.lgaName, state: w.lga.state, wardName: w.wardName, wardNumber: w.wardNumber,
    councillorName: w.councillorName, councillorEmail: w.councillorEmail, councillorPhone: w.councillorPhone,
    population: w.population, description: w.description,
  }));

  const lines = [
    COLUMNS.join(","),
    ...rows.map((r) => COLUMNS.map((c) => csvEscape(r[c])).join(",")),
  ];

  return new NextResponse(lines.join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="ward-records-${new Date().toISOString().split("T")[0]}.csv"`,
    },
  });
}
