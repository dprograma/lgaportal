import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getLgaSession, requireChairman } from "@/lib/lga-auth";
import { initializeTransaction } from "@/lib/paystack";

// Configurable without a code change — see .env.example.
function subscriptionFeeNaira(): number {
  return Number(process.env.LGA_SUBSCRIPTION_FEE_NAIRA ?? "30000");
}
function subscriptionDurationDays(): number {
  return Number(process.env.LGA_SUBSCRIPTION_DURATION_DAYS ?? "30");
}

// GET — fee/cycle info for display, no payment initiated.
export async function GET(req: NextRequest) {
  const session = await getLgaSession(req);
  if (!session) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  return NextResponse.json({
    amountNaira: subscriptionFeeNaira(),
    durationDays: subscriptionDurationDays(),
  });
}

// POST — chairman-only: creates a PENDING transaction and starts a real
// Paystack checkout for it.
export async function POST(req: NextRequest) {
  const session = await requireChairman(req);
  if (session instanceof NextResponse) return session;

  const lga = await db.lGA.findUnique({
    where: { id: session.lgaId },
    select: { email: true, chairmanName: true, lgaName: true, subscriptionStatus: true },
  });
  if (!lga) return NextResponse.json({ error: "LGA not found." }, { status: 404 });

  const amountNaira = subscriptionFeeNaira();
  const durationDays = subscriptionDurationDays();
  const purpose = lga.subscriptionStatus === "ACTIVE" ? "LGA_RENEWAL" : "LGA_SUBSCRIPTION";

  const reference = "lga-" + crypto.randomUUID().replace(/-/g, "");
  const invoiceNumber = "INV-" + new Date().getFullYear() + "-" + String(Date.now()).slice(-6);

  try {
    const transaction = await db.transaction.create({
      data: {
        lgaId: session.lgaId,
        amount: BigInt(Math.round(amountNaira * 100)),
        purpose,
        status: "PENDING",
        paystackRef: reference,
        invoiceNumber,
        metadata: { email: lga.email, name: lga.chairmanName, planDurationDays: durationDays },
      },
    });

    const result = await initializeTransaction({
      email: lga.email,
      amount: Math.round(amountNaira * 100),
      reference,
      callback_url: (process.env.NEXTAUTH_URL ?? "") + "/payment/callback",
      metadata: { transactionId: transaction.id, lgaId: session.lgaId },
    });

    return NextResponse.json({ authorization_url: result.authorization_url, reference });
  } catch (e) {
    console.error("LGA subscription initialize error:", e);
    return NextResponse.json({ error: "Payment initialization failed." }, { status: 500 });
  }
}
