import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { generateInvoicePDF } from "@/lib/invoice";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { id } = await params;

  const transaction = await db.transaction.findUnique({ where: { id } });
  if (!transaction) {
    return new Response("Not found", { status: 404 });
  }

  // Verify ownership
  const isOwner = transaction.userId === session.user.id;
  let isLgaChairman = false;

  if (!isOwner && transaction.lgaId) {
    const chairman = await db.lGAChairman.findFirst({
      where: { lgaId: transaction.lgaId, email: session.user.email ?? "" },
    });
    isLgaChairman = !!chairman;
  }

  if (!isOwner && !isLgaChairman && session.user.role !== "ADMIN") {
    return new Response("Forbidden", { status: 403 });
  }

  // Return cached PDF if available
  if (transaction.invoiceUrl?.startsWith("data:application/pdf;base64,")) {
    const base64 = transaction.invoiceUrl.replace("data:application/pdf;base64,", "");
    const buffer = Buffer.from(base64, "base64");
    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="invoice-${transaction.invoiceNumber ?? id}.pdf"`,
        "Content-Length": buffer.length.toString(),
      },
    });
  }

  // Generate fresh
  const meta = (transaction.metadata ?? {}) as Record<string, unknown>;
  try {
    const pdfBuffer = await generateInvoicePDF({
      invoiceNumber: transaction.invoiceNumber ?? `INV-${Date.now()}`,
      date: transaction.paidAt ?? transaction.createdAt,
      payerName: (meta.name as string) ?? "Customer",
      payerEmail: (meta.email as string) ?? "",
      description:
        transaction.purpose === "AD_CAMPAIGN"
          ? "Advertising Campaign Payment"
          : transaction.purpose === "LGA_SUBSCRIPTION"
          ? "LGA Subscription Payment"
          : "LGA Renewal Payment",
      amount: transaction.amount,
      reference: transaction.paystackRef ?? id,
      purpose: transaction.purpose,
    });

    return new Response(new Uint8Array(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="invoice-${transaction.invoiceNumber ?? id}.pdf"`,
        "Content-Length": pdfBuffer.length.toString(),
      },
    });
  } catch (e) {
    console.error("Invoice generation error:", e);
    return new Response("Failed to generate invoice", { status: 500 });
  }
}
