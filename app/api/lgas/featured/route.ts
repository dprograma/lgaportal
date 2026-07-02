import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

// GET /api/lgas/featured — LGAs ordered by published project count, for landing leaderboard
export async function GET() {
  try {
    const lgas = await db.lGA.findMany({
      where: { status: "APPROVED" },
      select: {
        id: true,
        lgaName: true,
        state: true,
        isVerified: true,
        _count: {
          select: {
            projects: { where: { isPublished: true, approvalStatus: "APPROVED" } },
            endowments: { where: { isPublished: true } },
          },
        },
      },
      orderBy: { projects: { _count: "desc" } },
      take: 8,
    });

    return NextResponse.json({ lgas }, {
      headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60" },
    });
  } catch {
    return NextResponse.json({ error: "Failed to load featured LGAs." }, { status: 500 });
  }
}
