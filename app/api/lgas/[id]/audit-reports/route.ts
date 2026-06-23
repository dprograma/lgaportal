import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/lgas/[id]/audit-reports — public: audit reports for an LGA
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id }          = await params;
  const { searchParams } = req.nextUrl;
  const year = searchParams.get("year") ? Number(searchParams.get("year")) : undefined;

  const where = {
    lgaId: id,
    isPublished: true,
    ...(year ? { financialYear: year } : {}),
  };

  const reports = await db.auditReport.findMany({
    where,
    orderBy: { financialYear: "desc" },
    select: {
      id: true, financialYear: true, title: true,
      auditingBody: true, reportUrl: true, createdAt: true,
    },
  });

  return NextResponse.json({ reports });
}
