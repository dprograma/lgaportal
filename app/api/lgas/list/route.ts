import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const state    = searchParams.get("state")    ?? undefined;
  const search   = searchParams.get("search")   ?? undefined;
  const take     = Math.min(parseInt(searchParams.get("limit") ?? "24"), 100);
  const skip     = parseInt(searchParams.get("offset") ?? "0");

  const where: Record<string, unknown> = { status: "APPROVED" };
  if (state)  where.state   = state;
  if (search) where.lgaName = { contains: search, mode: "insensitive" };

  const [lgas, total] = await Promise.all([
    db.lGA.findMany({
      where,
      select: {
        id: true, lgaName: true, state: true, isVerified: true,
        description: true, sectors: true,
        _count: { select: { wards: true, endowments: true } },
      },
      orderBy: { lgaName: "asc" },
      take,
      skip,
    }),
    db.lGA.count({ where }),
  ]);

  return NextResponse.json({ lgas, total });
}
