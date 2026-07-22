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
export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") ?? undefined;
  const search = searchParams.get("search") ?? undefined;
  const state  = searchParams.get("state")  ?? undefined;

  const where: Record<string, unknown> = {};
  if (status && status !== "ALL") where.status = status;
  if (search) where.lgaName = { contains: search, mode: "insensitive" };
  if (state)  where.state   = { contains: state, mode: "insensitive" };

  const lgas = await db.lGA.findMany({
    where,
    select: {
      email: true, lgaName: true, state: true, chairmanName: true, phone: true,
      officeAddress: true, population: true, description: true, logoUrl: true,
    },
    orderBy: [{ state: "asc" }, { lgaName: "asc" }],
    take: 1000,
  });

  const lines = [
    COLUMNS.join(","),
    ...lgas.map((l) => COLUMNS.map((c) => csvEscape(l[c])).join(",")),
  ];

  return new NextResponse(lines.join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="lga-records-${new Date().toISOString().split("T")[0]}.csv"`,
    },
  });
}
