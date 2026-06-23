import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/lgas/[id]/archive — public: archived posts for an LGA with tenure labels
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id }          = await params;
  const { searchParams } = req.nextUrl;
  const tenureId = searchParams.get("tenureId") ?? undefined;
  const take     = Math.min(Number(searchParams.get("limit")  ?? 20), 50);
  const skip     = Number(searchParams.get("offset") ?? 0);

  const where = {
    lgaId: id,
    status: "ARCHIVED" as const,
    ...(tenureId ? { tenureId } : {}),
  };

  const [posts, total] = await Promise.all([
    db.post.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take,
      skip,
      select: {
        id: true, title: true, content: true, imageUrl: true,
        viewCount: true, createdAt: true,
        tenure: { select: { id: true, chairmanName: true, startDate: true, endDate: true } },
        _count: { select: { reactions: true, comments: true } },
      },
    }),
    db.post.count({ where }),
  ]);

  return NextResponse.json({ posts, total });
}
