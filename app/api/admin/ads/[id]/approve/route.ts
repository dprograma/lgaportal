import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { isAdminRequest } from "@/lib/admin-auth";
import { resend } from "@/lib/resend";


export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAdminRequest(req)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  const campaign = await db.adCampaign.findUnique({
    where: { id },
    include: { advertiser: { select: { email: true, name: true } } },
  });

  if (!campaign) {
    return Response.json({ error: "Campaign not found" }, { status: 404 });
  }

  try {
    const updated = await db.adCampaign.update({
      where: { id },
      data: { status: "APPROVED" },
    });

    // Send email
    const subject = "Your ad campaign has been approved";
    const html = `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
        <h2 style="color:#15803d">Campaign Approved</h2>
        <p>Hi ${campaign.advertiser.name},</p>
        <p>Great news! Your advertising campaign <strong>"${campaign.title}"</strong> has been approved.</p>
        <p>Your campaign will go live once payment is confirmed.</p>
        <p>Log in to your advertiser dashboard to manage your campaign.</p>
        <hr/>
        <p style="font-size:12px;color:#64748b">LGA Portal Nigeria · noreply@lgaportal.ng</p>
      </div>
    `;

    let emailStatus = "SENT";
    let emailError: string | undefined;
    try {
      await resend.emails.send({
        from: "noreply@lgaportal.ng",
        to: campaign.advertiser.email,
        subject,
        html,
      });
    } catch (e) {
      emailStatus = "FAILED";
      emailError = String(e);
    }

    await db.emailNotificationLog.create({
      data: {
        to: campaign.advertiser.email,
        subject,
        purpose: "AD_CAMPAIGN_APPROVED",
        status: emailStatus,
        attempts: 1,
        error: emailError,
      },
    });

    return Response.json({ campaign: updated });
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Failed to approve campaign" }, { status: 500 });
  }
}
