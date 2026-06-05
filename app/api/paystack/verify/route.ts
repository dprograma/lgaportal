import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { verifyTransaction } from "@/lib/paystack";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const reference = req.nextUrl.searchParams.get("reference");
  if (!reference) {
    return Response.json({ error: "Missing reference" }, { status: 400 });
  }

  try {
    const transaction = await db.transaction.findUnique({
      where: { paystackRef: reference },
    });

    if (!transaction) {
      return Response.json({ error: "Transaction not found" }, { status: 404 });
    }

    // If already settled, return DB status
    if (transaction.status === "SUCCESS" || transaction.status === "FAILED") {
      return Response.json({ status: transaction.status, transaction });
    }

    // Verify with Paystack
    const result = await verifyTransaction(reference);
    const paystackStatus = result.data.status; // "success" | "failed"

    const dbStatus = paystackStatus === "success" ? "SUCCESS" : paystackStatus === "failed" ? "FAILED" : "PENDING";

    if (dbStatus !== "PENDING") {
      await db.transaction.update({
        where: { id: transaction.id },
        data: {
          status: dbStatus,
          paystackData: result.data as unknown as Record<string, unknown>,
          paidAt: paystackStatus === "success" ? new Date(result.data.paid_at) : null,
        },
      });
    }

    const updated = await db.transaction.findUnique({ where: { id: transaction.id } });

    return Response.json({ status: dbStatus, transaction: updated });
  } catch (e) {
    console.error("Verify transaction error:", e);
    return Response.json({ error: "Verification failed" }, { status: 500 });
  }
}
