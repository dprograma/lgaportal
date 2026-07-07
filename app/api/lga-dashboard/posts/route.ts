import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { Prisma, $Enums } from "@prisma/client";
import { getLgaSession } from "@/lib/lga-auth";

// GET /api/lga-dashboard/posts?status=DRAFT&scheduled=true
export async function GET(req: NextRequest) {
  const lgaSession = await getLgaSession(req);
  if (!lgaSession) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const lgaId = lgaSession.lgaId;

  const { searchParams } = req.nextUrl;
  const status     = searchParams.get("status") ?? undefined;     // DRAFT | PUBLISHED | ARCHIVED
  const scheduled  = searchParams.get("scheduled") === "true";    // only posts with future scheduledAt
  const take       = Math.min(Number(searchParams.get("limit")  ?? "50"), 100);
  const skip       = Number(searchParams.get("offset") ?? "0");

  const where: Prisma.PostWhereInput = { lgaId };
  if (status)    where.status = status as $Enums.PostStatus;
  if (scheduled) where.scheduledAt = { gt: new Date() };

  const [posts, total] = await Promise.all([
    db.post.findMany({
      where,
      orderBy: scheduled ? { scheduledAt: "asc" } : { createdAt: "desc" },
      take,
      skip,
      select: {
        id: true, title: true, status: true,
        scheduledAt: true, publishedAt: true,
        viewCount: true, createdAt: true,
        _count: { select: { reactions: true, comments: true } },
      },
    }),
    db.post.count({ where }),
  ]);

  return NextResponse.json({ posts, total });
}
