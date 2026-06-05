import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { initializeTransaction } from "@/lib/paystack";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADVERTISER") {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const campaigns = await db.adCampaign.findMany({
      where: { advertiserId: session.user.id },
      include: { plan: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    });
    return Response.json({ campaigns });
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Failed to fetch campaigns" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADVERTISER") {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: {
    planId: string;
    title: string;
    description?: string;
    format: string;
    placement: string;
    linkUrl: string;
    creativeUrl?: string;
  };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { planId, title, format, placement, linkUrl, description, creativeUrl } = body;
  if (!planId || !title || !format || !placement || !linkUrl) {
    return Response.json({ error: "Missing required fields" }, { status: 400 });
  }

  const plan = await db.adPlan.findUnique({ where: { id: planId } });
  if (!plan || !plan.isActive) {
    return Response.json({ error: "Invalid or inactive plan" }, { status: 400 });
  }

  const user = await db.user.findUnique({ where: { id: session.user.id } });
  if (!user) {
    return Response.json({ error: "User not found" }, { status: 404 });
  }

  try {
    const campaign = await db.adCampaign.create({
      data: {
        advertiserId: session.user.id,
        planId,
        title,
        description: description ?? null,
        format,
        placement,
        linkUrl,
        creativeUrl: creativeUrl ?? null,
        status: "PENDING_REVIEW",
      },
    });

    const reference = "lga-" + crypto.randomUUID().replace(/-/g, "");
    const invoiceNumber = "INV-" + new Date().getFullYear() + "-" + String(Date.now()).slice(-6);

    const transaction = await db.transaction.create({
      data: {
        userId: session.user.id,
        campaignId: campaign.id,
        amount: plan.price,
        purpose: "AD_CAMPAIGN",
        status: "PENDING",
        paystackRef: reference,
        invoiceNumber,
        metadata: {
          email: user.email,
          name: user.name,
          campaignId: campaign.id,
          planId,
          durationDays: plan.durationDays,
        },
      },
    });

    // Update campaign with paystackRef
    await db.adCampaign.update({
      where: { id: campaign.id },
      data: { paystackRef: reference },
    });

    const result = await initializeTransaction({
      email: user.email,
      amount: Number(plan.price),
      reference,
      callback_url: (process.env.NEXTAUTH_URL ?? "") + "/payment/callback",
      metadata: {
        campaignId: campaign.id,
        planId,
        durationDays: plan.durationDays,
        transactionId: transaction.id,
      },
    });

    return Response.json(
      { campaign, authorization_url: result.authorization_url },
      { status: 201 }
    );
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Failed to create campaign" }, { status: 500 });
  }
}
