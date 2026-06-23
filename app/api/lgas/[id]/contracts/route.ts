import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/lgas/[id]/contracts — public: procurement contracts for an LGA
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id }          = await params;
  const { searchParams } = req.nextUrl;
  const search = searchParams.get("search") ?? "";
  const take   = Math.min(Number(searchParams.get("limit")  ?? 20), 100);
  const skip   = Number(searchParams.get("offset") ?? 0);

  const where = {
    lgaId: id,
    isPublished: true,
    ...(search ? {
      OR: [
        { title:      { contains: search, mode: "insensitive" as const } },
        { contractor: { contains: search, mode: "insensitive" as const } },
      ],
    } : {}),
  };

  const [contracts, total] = await Promise.all([
    db.procurementContract.findMany({
      where,
      orderBy: { awardDate: "desc" },
      take,
      skip,
      select: {
        id: true, title: true, contractor: true, value: true,
        awardDate: true, scope: true, source: true, createdAt: true,
      },
    }),
    db.procurementContract.count({ where }),
  ]);

  return NextResponse.json({
    contracts: contracts.map((c) => ({ ...c, value: c.value.toString() })),
    total,
  });
}
