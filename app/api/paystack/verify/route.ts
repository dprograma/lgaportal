import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { verifyTransaction } from "@/lib/paystack";
import { getLgaSession } from "@/lib/lga-auth";

export async function GET(req: NextRequest) {
  // Owned either by the paying citizen (NextAuth session) or by the LGA it
  // was billed to (lga_session cookie) — an LGA chairman has no citizen
  // session at all, so this must accept either.
  const session = await auth();
  const lgaSession = await getLgaSession(req);
  if (!session?.user?.id && !lgaSession) {
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

    const ownsAsUser = session?.user?.id && transaction.userId === session.user.id;
    const ownsAsLga  = lgaSession && transaction.lgaId === lgaSession.lgaId;
    if (!ownsAsUser && !ownsAsLga) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
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
          paystackData: JSON.parse(JSON.stringify(result.data)),
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
