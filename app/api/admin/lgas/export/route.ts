import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAdminRequest } from "@/lib/admin-auth";

function csvEscape(v: unknown): string {
  const s = v === null || v === undefined ? "" : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

const COLUMNS = [
  "email", "lgaName", "state", "chairmanName", "phone",
  "officeAddress", "population", "description", "logoUrl",
] as const;

// GET /api/admin/lgas/export — download existing LGA records as CSV, ready
// to be edited and re-uploaded via POST /api/admin/lgas/bulk-update.
// Pass ?id=<lgaId> for a single-record CSV (one row) instead of the filtered
// bulk export.
export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id     = searchParams.get("id") ?? undefined;
  const status = searchParams.get("status") ?? undefined;
  const search = searchParams.get("search") ?? undefined;
  const state  = searchParams.get("state")  ?? undefined;

  const where: Record<string, unknown> = {};
  if (id) {
    where.id = id;
  } else {
    if (status && status !== "ALL") where.status = status;
    if (search) where.lgaName = { contains: search, mode: "insensitive" };
    if (state)  where.state   = { contains: state, mode: "insensitive" };
  }

  const lgas = await db.lGA.findMany({
    where,
    select: {
      email: true, lgaName: true, state: true, chairmanName: true, phone: true,
      officeAddress: true, population: true, description: true, logoUrl: true,
    },
    orderBy: [{ state: "asc" }, { lgaName: "asc" }],
    take: id ? 1 : 1000,
  });

  if (id && lgas.length === 0) {
    return NextResponse.json({ error: "LGA not found." }, { status: 404 });
  }

  const lines = [
    COLUMNS.join(","),
    ...lgas.map((l) => COLUMNS.map((c) => csvEscape(l[c])).join(",")),
  ];

  const filename = id
    ? `lga-${lgas[0].lgaName.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.csv`
    : `lga-records-${new Date().toISOString().split("T")[0]}.csv`;

  return new NextResponse(lines.join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
