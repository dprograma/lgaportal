import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendLGAApprovalEmail } from "@/lib/email";

const ADMIN_SECRET = process.env.ADMIN_SECRET ?? "";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const secret = req.headers.get("x-admin-secret");
  if (!ADMIN_SECRET || secret !== ADMIN_SECRET) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { id } = await params;

  const lga = await db.lGA.findUnique({
    where: { id },
    select: { id: true, lgaName: true, chairmanName: true, email: true, status: true },
  });

  if (!lga) return NextResponse.json({ error: "LGA not found." }, { status: 404 });
  if (lga.status === "APPROVED") {
    return NextResponse.json({ error: "LGA is already approved." }, { status: 409 });
  }

  await db.lGA.update({
    where: { id },
    data: { status: "APPROVED", isVerified: true },
  });

  // Update all pending verification docs to VERIFIED
  await db.lGAVerificationDoc.updateMany({
    where: { lgaId: id, status: "PENDING" },
    data: { status: "VERIFIED" },
  });

  try {
    await sendLGAApprovalEmail(lga.email, lga.chairmanName, lga.lgaName);
  } catch (err) {
    console.error("[approve] email failed:", err);
  }

  return NextResponse.json({ success: true, message: `${lga.lgaName} approved.` });
}
