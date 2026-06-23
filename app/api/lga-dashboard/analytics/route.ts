import { NextRequest, NextResponse } from "next/server";
import { db as prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const lgaId = req.headers.get("x-lga-id");
  if (!lgaId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const lga = await prisma.lGA.findUnique({ where: { id: lgaId }, select: { id: true } });
  if (!lga) return NextResponse.json({ error: "LGA not found" }, { status: 404 });

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo  = new Date(now.getTime() -  7 * 24 * 60 * 60 * 1000);

  const [
    totalPosts,
    publishedPosts,
    draftPosts,
    archivedPosts,
    recentPosts,
    topPosts,
    totalViews,
    totalReactions,
    totalComments,
    reactionBreakdown,
    dailyPosts,
  ] = await Promise.all([
    prisma.post.count({ where: { lgaId } }),
    prisma.post.count({ where: { lgaId, status: "PUBLISHED" } }),
    prisma.post.count({ where: { lgaId, status: "DRAFT" } }),
    prisma.post.count({ where: { lgaId, status: "ARCHIVED" } }),
    prisma.post.count({ where: { lgaId, createdAt: { gte: sevenDaysAgo } } }),
    prisma.post.findMany({
      where: { lgaId, status: "PUBLISHED" },
      orderBy: { viewCount: "desc" },
      take: 5,
      select: { id: true, title: true, viewCount: true, createdAt: true,
        _count: { select: { reactions: true, comments: true } } },
    }),
    prisma.post.aggregate({ where: { lgaId }, _sum: { viewCount: true } }),
    prisma.reaction.count({ where: { post: { lgaId } } }),
    prisma.comment.count({ where: { post: { lgaId } } }),
    prisma.reaction.groupBy({
      by: ["type"],
      where: { post: { lgaId } },
      _count: { type: true },
    }),
    prisma.post.findMany({
      where: { lgaId, createdAt: { gte: thirtyDaysAgo } },
      orderBy: { createdAt: "asc" },
      select: { createdAt: true, viewCount: true, status: true },
    }),
  ]);

  // Aggregate daily posts into a day-by-day chart dataset
  const dayMap: Record<string, { date: string; posts: number; views: number }> = {};
  for (let d = 0; d < 30; d++) {
    const dt = new Date(thirtyDaysAgo.getTime() + d * 86_400_000);
    const key = dt.toISOString().slice(0, 10);
    dayMap[key] = { date: key, posts: 0, views: 0 };
  }
  for (const p of dailyPosts) {
    const key = new Date(p.createdAt).toISOString().slice(0, 10);
    if (dayMap[key]) {
      dayMap[key].posts += 1;
      dayMap[key].views += p.viewCount;
    }
  }

  return NextResponse.json({
    overview: {
      totalPosts,
      publishedPosts,
      draftPosts,
      archivedPosts,
      recentPosts,
      totalViews: totalViews._sum.viewCount ?? 0,
      totalReactions,
      totalComments,
    },
    topPosts,
    reactionBreakdown: reactionBreakdown.map((r) => ({ type: r.type, count: r._count.type })),
    dailyActivity: Object.values(dayMap),
  });
}
