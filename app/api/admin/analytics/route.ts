import { NextRequest, NextResponse } from "next/server";
import { db as prisma } from "@/lib/db";

const ADMIN_SECRET = process.env.ADMIN_SECRET ?? "";

export async function GET(req: NextRequest) {
  if (req.headers.get("x-admin-secret") !== ADMIN_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [
    lgaCounts,
    userCounts,
    recentLgas,
    revenueStats,
    postsTotal,
    postsRecent,
    topLgasByPosts,
    monthlyRevenue,
  ] = await Promise.all([
    // LGA status breakdown
    prisma.lGA.groupBy({ by: ["status"], _count: { status: true } }),
    // User role breakdown
    prisma.user.groupBy({ by: ["role"], _count: { role: true } }),
    // Recent LGA signups (last 30 days)
    prisma.lGA.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
    // All-time revenue from completed transactions
    prisma.transaction.aggregate({
      where: { status: "SUCCESS" },
      _sum: { amount: true },
      _count: { id: true },
    }),
    // Total posts across platform
    prisma.post.count(),
    // Posts published in last 30 days
    prisma.post.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
    // Top 5 LGAs by post count
    prisma.lGA.findMany({
      take: 5,
      orderBy: { posts: { _count: "desc" } },
      select: {
        id: true, lgaName: true, state: true, status: true,
        _count: { select: { posts: true } },
      },
    }),
    // Monthly revenue (last 6 months)
    prisma.$queryRaw<{ month: string; total: bigint }[]>`
      SELECT TO_CHAR(DATE_TRUNC('month', "paidAt"), 'YYYY-MM') AS month,
             SUM(amount) AS total
      FROM   transactions
      WHERE  status = 'SUCCESS'
        AND  "paidAt" >= NOW() - INTERVAL '6 months'
      GROUP  BY 1
      ORDER  BY 1
    `,
  ]);

  const lgaByStatus = Object.fromEntries(
    lgaCounts.map((r) => [r.status, r._count.status])
  );
  const userByRole = Object.fromEntries(
    userCounts.map((r) => [r.role, r._count.role])
  );

  return NextResponse.json({
    lgas: {
      total: lgaCounts.reduce((s, r) => s + r._count.status, 0),
      byStatus: lgaByStatus,
      recentSignups: recentLgas,
    },
    users: {
      total: userCounts.reduce((s, r) => s + r._count.role, 0),
      byRole: userByRole,
    },
    posts: { total: postsTotal, recent: postsRecent },
    revenue: {
      total: (revenueStats._sum.amount ?? BigInt(0)).toString(),
      transactions: revenueStats._count.id,
    },
    topLgasByPosts,
    monthlyRevenue: monthlyRevenue.map((r) => ({
      month: r.month,
      // total may arrive as string or BigInt depending on pg driver; normalise to string
      total: String(r.total ?? "0"),
    })),
  });
}
