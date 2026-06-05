import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { initializeTransaction } from "@/lib/paystack";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    amount: number;
    email: string;
    purpose: string;
    metadata: Record<string, unknown>;
  };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { amount, email, purpose, metadata } = body;
  if (!amount || !email || !purpose) {
    return Response.json({ error: "Missing required fields" }, { status: 400 });
  }

  const reference = "lga-" + crypto.randomUUID().replace(/-/g, "");
  const invoiceNumber =
    "INV-" + new Date().getFullYear() + "-" + String(Date.now()).slice(-6);

  try {
    const transaction = await db.transaction.create({
      data: {
        userId: session.user.id,
        amount: BigInt(amount),
        purpose,
        status: "PENDING",
        paystackRef: reference,
        invoiceNumber,
        metadata: { ...metadata, email, name: session.user.name },
      },
    });

    const result = await initializeTransaction({
      email,
      amount,
      reference,
      callback_url: (process.env.NEXTAUTH_URL ?? "") + "/payment/callback",
      metadata: { ...metadata, transactionId: transaction.id },
    });

    return Response.json({
      authorization_url: result.authorization_url,
      reference,
      transactionId: transaction.id,
    });
  } catch (e) {
    console.error("Initialize transaction error:", e);
    return Response.json({ error: "Payment initialization failed" }, { status: 500 });
  }
}
