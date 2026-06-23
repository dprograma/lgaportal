import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { StreamStatus } from "@prisma/client";

// Public: list upcoming + live streams
export async function GET(_req: NextRequest) {
  const streams = await db.liveStream.findMany({
    where: { status: { in: [StreamStatus.UPCOMING, StreamStatus.LIVE] } },
    orderBy: { scheduledAt: "asc" },
    take: 10,
    include: { lga: { select: { lgaName: true, state: true } } },
  });

  return NextResponse.json({ streams });
}
