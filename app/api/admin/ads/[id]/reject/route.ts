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

  let body: { reason: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.reason?.trim()) {
    return Response.json({ error: "Rejection reason is required" }, { status: 400 });
  }

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
      data: { status: "REJECTED", rejectionReason: body.reason },
    });

    // Send email
    const subject = "Your ad campaign was not approved";
    const html = `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
        <h2 style="color:#dc2626">Campaign Not Approved</h2>
        <p>Hi ${campaign.advertiser.name},</p>
        <p>Unfortunately, your advertising campaign <strong>"${campaign.title}"</strong> was not approved.</p>
        <p><strong>Reason:</strong> ${body.reason}</p>
        <p>Please review our advertising guidelines and resubmit your campaign if you believe this was in error.</p>
        <p>If you have questions, please contact us at support@lgaportal.ng.</p>
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
        purpose: "AD_CAMPAIGN_REJECTED",
        status: emailStatus,
        attempts: 1,
        error: emailError,
      },
    });

    return Response.json({ campaign: updated });
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Failed to reject campaign" }, { status: 500 });
  }
}
