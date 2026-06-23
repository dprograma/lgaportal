import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/lgas/[id]/succession — public: chairman succession history for an LGA
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const tenures = await db.lGATenure.findMany({
    where: { lgaId: id },
    orderBy: { startDate: "desc" },
    select: {
      id: true, chairmanName: true, startDate: true, endDate: true,
      isActive: true, status: true,
      _count: { select: { posts: true } },
    },
  });

  return NextResponse.json({ tenures });
}
