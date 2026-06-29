import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendTenureExpiryReminder } from "@/lib/email";
import { isAdminRequest } from "@/lib/admin-auth";


export async function POST(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const now = new Date();
  const in30 = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const in7  = new Date(now.getTime() + 7  * 24 * 60 * 60 * 1000);
  const results = { reminded30: 0, reminded7: 0, graced: 0, suspended: 0 };

  // Fetch all active, approved LGAs with a tenure end date
  const lgas = await db.lGA.findMany({
    where: {
      status: "APPROVED",
      tenureEndDate: { not: null },
      tenureStatus: { in: ["ACTIVE", "TENURE_ENDED"] },
    },
    select: {
      id: true, lgaName: true, chairmanName: true, email: true,
      tenureEndDate: true, tenureStatus: true, gracePeriodEndsAt: true,
    },
  });

  for (const lga of lgas) {
    if (!lga.tenureEndDate) continue;
    const daysUntilEnd = Math.ceil((lga.tenureEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (lga.tenureStatus === "ACTIVE") {
      // Send 30-day reminder
      if (daysUntilEnd === 30 || daysUntilEnd === 29) {
        try { await sendTenureExpiryReminder(lga.email, lga.chairmanName, lga.lgaName, daysUntilEnd); results.reminded30++; } catch {}
      }
      // Send 7-day reminder
      if (daysUntilEnd <= 7 && daysUntilEnd > 0) {
        try { await sendTenureExpiryReminder(lga.email, lga.chairmanName, lga.lgaName, daysUntilEnd); results.reminded7++; } catch {}
      }
      // Tenure has ended — start grace period
      if (lga.tenureEndDate <= now) {
        const gracePeriodEndsAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        await db.lGA.update({
          where: { id: lga.id },
          data: { tenureStatus: "TENURE_ENDED", gracePeriodEndsAt },
        });
        results.graced++;
      }
    }

    // Grace period ended — suspend
    if (lga.tenureStatus === "TENURE_ENDED" && lga.gracePeriodEndsAt && lga.gracePeriodEndsAt <= now) {
      await db.lGA.update({
        where: { id: lga.id },
        data: { tenureStatus: "SUSPENDED", status: "SUSPENDED" },
      });
      results.suspended++;
    }
  }

  return NextResponse.json({ success: true, ...results });
}

