import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendFreeTrialExpiryReminder } from "@/lib/email";
import { isAdminRequest } from "@/lib/admin-auth";


export async function POST(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const now = new Date();
  const in14 = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

  // LGAs whose free trial ends within 14 days
  const expiring = await db.lGA.findMany({
    where: {
      status: "APPROVED",
      freeUntil: { gt: now, lte: in14 },
    },
    select: {
      lgaName: true, chairmanName: true, email: true, freeUntil: true,
    },
  });

  let sent = 0;
  for (const lga of expiring) {
    const daysLeft = Math.ceil((lga.freeUntil!.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    try {
      await sendFreeTrialExpiryReminder(lga.email, lga.chairmanName, lga.lgaName, daysLeft);
      sent++;
    } catch (err) {
      console.error(`[expiring] email failed for ${lga.lgaName}:`, err);
    }
  }

  return NextResponse.json({ success: true, total: expiring.length, sent });
}

export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const now = new Date();
  const in14 = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

  const expiring = await db.lGA.findMany({
    where: { status: "APPROVED", freeUntil: { gt: now, lte: in14 } },
    select: { id: true, lgaName: true, state: true, freeUntil: true, chairmanName: true },
    orderBy: { freeUntil: "asc" },
  });

  return NextResponse.json({ expiring, total: expiring.length });
}

