import { NextRequest } from "next/server";
import { db } from "@/lib/db";

function isAdmin(req: NextRequest) {
  return req.headers.get("x-admin-secret") === process.env.ADMIN_SECRET;
}

export async function GET(req: NextRequest) {
  if (!isAdmin(req)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Total revenue
    const allSuccess = await db.transaction.findMany({
      where: { status: "SUCCESS" },
      select: { amount: true, purpose: true, createdAt: true },
    });

    const totalRevenue = allSuccess.reduce((sum, t) => sum + Number(t.amount), 0);

    // By purpose
    const byPurposeMap: Record<string, number> = {};
    for (const t of allSuccess) {
      byPurposeMap[t.purpose] = (byPurposeMap[t.purpose] ?? 0) + Number(t.amount);
    }
    const byPurpose = Object.entries(byPurposeMap).map(([purpose, amount]) => ({
      purpose,
      amount,
    }));

    // Last 30 days daily revenue
    const recent30 = allSuccess.filter((t) => t.createdAt >= thirtyDaysAgo);
    const byDayMap: Record<string, number> = {};
    for (const t of recent30) {
      const dateKey = t.createdAt.toISOString().split("T")[0];
      byDayMap[dateKey] = (byDayMap[dateKey] ?? 0) + Number(t.amount);
    }
    const byDay = Object.entries(byDayMap)
      .map(([date, amount]) => ({ date, amount }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Recent transactions
    const recentTransactions = await db.transaction.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    // Campaigns counts
    const [activeCampaigns, pendingReview] = await Promise.all([
      db.adCampaign.count({ where: { status: "ACTIVE" } }),
      db.adCampaign.count({ where: { status: "PENDING_REVIEW" } }),
    ]);

    return Response.json({
      totalRevenue,
      byPurpose,
      byDay,
      recentTransactions: recentTransactions.map((t) => ({
        ...t,
        amount: t.amount.toString(),
      })),
      activeCampaigns,
      pendingReview,
    });
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Failed to fetch revenue data" }, { status: 500 });
  }
}
