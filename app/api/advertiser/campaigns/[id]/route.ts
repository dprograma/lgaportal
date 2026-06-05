import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const campaign = await db.adCampaign.findUnique({
    where: { id },
    include: { plan: true },
  });

  if (!campaign) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }
  if (campaign.advertiserId !== session.user.id) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  // Daily impression/click breakdown for last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const impressions = await db.adImpression.findMany({
    where: { campaignId: id, createdAt: { gte: thirtyDaysAgo } },
    select: { createdAt: true },
  });

  // Group by date
  const byDate: Record<string, { date: string; impressions: number; clicks: number }> = {};
  for (const imp of impressions) {
    const dateKey = imp.createdAt.toISOString().split("T")[0];
    if (!byDate[dateKey]) byDate[dateKey] = { date: dateKey, impressions: 0, clicks: 0 };
    byDate[dateKey].impressions += 1;
  }

  const dailyStats = Object.values(byDate).sort((a, b) => a.date.localeCompare(b.date));

  return Response.json({ campaign, dailyStats });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const campaign = await db.adCampaign.findUnique({ where: { id } });
  if (!campaign) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }
  if (campaign.advertiserId !== session.user.id) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const updateData: Record<string, unknown> = {};

  // Status: only PAUSED <-> ACTIVE allowed
  if (body.status !== undefined) {
    const newStatus = body.status as string;
    if (newStatus === "PAUSED" && campaign.status === "ACTIVE") {
      updateData.status = "PAUSED";
    } else if (newStatus === "ACTIVE" && campaign.status === "PAUSED") {
      updateData.status = "ACTIVE";
    } else {
      return Response.json({ error: "Invalid status transition" }, { status: 400 });
    }
  }

  if (body.creativeUrl !== undefined) updateData.creativeUrl = body.creativeUrl;
  if (body.linkUrl !== undefined) updateData.linkUrl = body.linkUrl;
  if (body.title !== undefined) updateData.title = body.title;
  if (body.description !== undefined) updateData.description = body.description;

  try {
    const updated = await db.adCampaign.update({
      where: { id },
      data: updateData,
    });
    return Response.json({ campaign: updated });
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Failed to update campaign" }, { status: 500 });
  }
}
