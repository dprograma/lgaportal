import { NextRequest } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const placement = req.nextUrl.searchParams.get("placement");
  if (!placement) {
    return Response.json({ ad: null });
  }

  const now = new Date();

  try {
    // Get all active campaigns for this placement
    const campaigns = await db.adCampaign.findMany({
      where: {
        status: "ACTIVE",
        placement,
        endDate: { gt: now },
      },
      select: {
        id: true,
        title: true,
        creativeUrl: true,
        linkUrl: true,
        format: true,
        placement: true,
      },
    });

    if (campaigns.length === 0) {
      return Response.json({ ad: null });
    }

    // Pick a random one
    const ad = campaigns[Math.floor(Math.random() * campaigns.length)];

    // Track impression
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      req.headers.get("x-real-ip") ??
      null;
    const userAgent = req.headers.get("user-agent") ?? null;
    const pageUrl = req.headers.get("referer") ?? null;

    await Promise.all([
      db.adImpression.create({
        data: { campaignId: ad.id, ip, userAgent, pageUrl },
      }),
      db.adCampaign.update({
        where: { id: ad.id },
        data: { impressions: { increment: 1 } },
      }),
    ]);

    return Response.json({ ad });
  } catch (e) {
    console.error("Ads route error:", e);
    return Response.json({ ad: null });
  }
}
