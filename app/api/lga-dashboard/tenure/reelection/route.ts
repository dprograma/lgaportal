import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { sendAdminReelectionNotification } from "@/lib/email";
import { getLgaSession } from "@/lib/lga-auth";

async function getLgaId(req: NextRequest): Promise<string | null> {
  return (await getLgaSession(req))?.lgaId ?? null;
}

const schema = z.object({
  newEndDate:   z.string().min(1, "New tenure end date is required"),
  fileData:     z.string().min(1, "Certificate of Election is required"),
  fileName:     z.string().min(1),
  mimeType:     z.string().refine(
    (v) => ["application/pdf", "image/jpeg", "image/jpg", "image/png"].includes(v),
    "Only PDF, JPG, or PNG accepted"
  ),
});

export async function POST(req: NextRequest) {
  const lgaId = await getLgaId(req);
  if (!lgaId) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 422 });
  }

  const lga = await db.lGA.findUnique({
    where: { id: lgaId },
    select: { id: true, lgaName: true, chairmanName: true, email: true, tenureEndDate: true },
  });
  if (!lga) return NextResponse.json({ error: "LGA not found." }, { status: 404 });

  const newEndDate = new Date(parsed.data.newEndDate);
  if (isNaN(newEndDate.getTime())) {
    return NextResponse.json({ error: "Invalid date format." }, { status: 400 });
  }

  const docUrl = `data:${parsed.data.mimeType};base64,${parsed.data.fileData}`;

  // Mark old active tenure as expired
  await db.lGATenure.updateMany({
    where: { lgaId, isActive: true },
    data: { isActive: false, status: "EXPIRED" },
  });

  // Create new tenure record
  await db.lGATenure.create({
    data: {
      lgaId,
      chairmanName: lga.chairmanName,
      startDate:    new Date(),
      endDate:      newEndDate,
      isActive:     true,
      status:       "ACTIVE",
      reElectionDoc: docUrl,
    },
  });

  // Update LGA tenure fields and reset status
  await db.lGA.update({
    where: { id: lgaId },
    data: {
      tenureEndDate:    newEndDate,
      tenureStartDate:  new Date(),
      tenureStatus:     "ACTIVE",
      gracePeriodEndsAt: null,
      status:           "APPROVED",
    },
  });

  // Notify admin
  try {
    await sendAdminReelectionNotification({
      lgaName:     lga.lgaName,
      chairmanName: lga.chairmanName,
      lgaEmail:    lga.email,
      newEndDate:  newEndDate.toLocaleDateString("en-NG", { year: "numeric", month: "long", day: "numeric" }),
    });
  } catch (err) {
    console.error("[reelection] email failed:", err);
  }

  return NextResponse.json({
    success: true,
    message: "Re-election notification submitted. Admin will review within 3–5 business days.",
  });
}

export async function GET(req: NextRequest) {
  const lgaId = await getLgaId(req);
  if (!lgaId) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const tenures = await db.lGATenure.findMany({
    where: { lgaId },
    select: {
      id: true, startDate: true, endDate: true,
      isActive: true, status: true, createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const lga = await db.lGA.findUnique({
    where: { id: lgaId },
    select: {
      tenureStartDate: true, tenureEndDate: true,
      tenureStatus: true, gracePeriodEndsAt: true, freeUntil: true,
    },
  });

  return NextResponse.json({ tenures, lga });
}
