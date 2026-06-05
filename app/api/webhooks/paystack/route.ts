import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { verifyWebhookSignature } from "@/lib/paystack";
import { generateInvoicePDF } from "@/lib/invoice";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-paystack-signature") ?? "";

  if (!verifyWebhookSignature(rawBody, signature)) {
    return new Response("Unauthorized", { status: 401 });
  }

  let event: string;
  let data: Record<string, unknown>;
  try {
    const parsed = JSON.parse(rawBody) as { event: string; data: Record<string, unknown> };
    event = parsed.event;
    data = parsed.data;
  } catch {
    return new Response("Bad Request", { status: 400 });
  }

  if (event === "charge.success") {
    const reference = data.reference as string;
    const paidAt = data.paid_at as string;

    const transaction = await db.transaction.findUnique({
      where: { paystackRef: reference },
    });

    if (!transaction) {
      return new Response("OK", { status: 200 });
    }

    // Idempotent: already processed
    if (transaction.status === "SUCCESS") {
      return new Response("OK", { status: 200 });
    }

    const meta = (transaction.metadata ?? {}) as Record<string, unknown>;
    const payerEmail = (meta.email as string) ?? "";
    const payerName = (meta.name as string) ?? "Customer";

    // Generate invoice PDF
    let invoiceUrl = transaction.invoiceUrl ?? "";
    try {
      const pdfBuffer = await generateInvoicePDF({
        invoiceNumber: transaction.invoiceNumber ?? `INV-${Date.now()}`,
        date: paidAt ? new Date(paidAt) : new Date(),
        payerName,
        payerEmail,
        description:
          transaction.purpose === "AD_CAMPAIGN"
            ? "Advertising Campaign Payment"
            : transaction.purpose === "LGA_SUBSCRIPTION"
            ? "LGA Subscription Payment"
            : "LGA Renewal Payment",
        amount: transaction.amount,
        reference,
        purpose: transaction.purpose,
      });
      invoiceUrl = "data:application/pdf;base64," + pdfBuffer.toString("base64");
    } catch (e) {
      console.error("Invoice generation failed:", e);
    }

    await db.transaction.update({
      where: { id: transaction.id },
      data: {
        status: "SUCCESS",
        paidAt: paidAt ? new Date(paidAt) : new Date(),
        paystackData: data,
        invoiceUrl,
      },
    });

    // Handle per purpose
    if (transaction.purpose === "LGA_SUBSCRIPTION" || transaction.purpose === "LGA_RENEWAL") {
      if (transaction.lgaId) {
        const durationDays = (meta.planDurationDays as number) ?? 30;
        const now = new Date();
        const subscriptionEnd = new Date(now.getTime() + durationDays * 86400 * 1000);
        await db.lGA.update({
          where: { id: transaction.lgaId },
          data: {
            subscriptionStatus: "ACTIVE",
            subscriptionEnd,
            freeUntil: null,
          },
        });
      }
    } else if (transaction.purpose === "AD_CAMPAIGN") {
      const campaign = await db.adCampaign.findFirst({
        where: { paystackRef: reference },
      });
      if (campaign) {
        const durationDays = (meta.durationDays as number) ?? 30;
        const now = new Date();
        const endDate = new Date(now.getTime() + durationDays * 86400 * 1000);
        await db.adCampaign.update({
          where: { id: campaign.id },
          data: {
            status: "ACTIVE",
            startDate: now,
            endDate,
          },
        });
      }
    }

    // Send confirmation email
    if (payerEmail) {
      const subject =
        transaction.purpose === "AD_CAMPAIGN"
          ? "Your advertising campaign payment was received"
          : "Your subscription payment was received";
      const html = `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
          <h2 style="color:#15803d">Payment Confirmed</h2>
          <p>Hi ${payerName},</p>
          <p>We have received your payment of <strong>${new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN" }).format(Number(transaction.amount) / 100)}</strong>.</p>
          <p><strong>Reference:</strong> ${reference}</p>
          ${transaction.invoiceNumber ? `<p><strong>Invoice Number:</strong> ${transaction.invoiceNumber}</p>` : ""}
          <p>Thank you for using LGA Portal.</p>
          <hr/>
          <p style="font-size:12px;color:#64748b">LGA Portal Nigeria · billing@lgaportal.ng</p>
        </div>
      `;

      let emailStatus = "SENT";
      let emailError: string | undefined;
      try {
        await resend.emails.send({
          from: "noreply@lgaportal.ng",
          to: payerEmail,
          subject,
          html,
        });
      } catch (e) {
        emailStatus = "FAILED";
        emailError = String(e);
      }

      await db.emailNotificationLog.create({
        data: {
          to: payerEmail,
          subject,
          purpose: "PAYMENT_CONFIRMATION",
          status: emailStatus,
          attempts: 1,
          error: emailError,
        },
      });
    }
  } else if (event === "charge.failed") {
    const reference = data.reference as string;
    await db.transaction.updateMany({
      where: { paystackRef: reference, status: "PENDING" },
      data: { status: "FAILED", paystackData: data },
    });
  }

  return new Response("OK", { status: 200 });
}
