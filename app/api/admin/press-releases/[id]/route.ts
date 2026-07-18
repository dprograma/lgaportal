import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { PressStatus } from "@prisma/client";
import { isAdminRequest } from "@/lib/admin-auth";
import { sendPressReleaseApprovedNotification, sendPressReleaseRejectedNotification } from "@/lib/email";


export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await req.json().catch(() => ({}));

  // action: "publish" | "reject" | or partial field update
  const data: Record<string, unknown> = {};
  if (body.action === "publish") {
    data.status    = PressStatus.PUBLISHED;
    data.approvedAt = new Date();
  } else if (body.action === "reject") {
    data.status          = PressStatus.REJECTED;
    data.rejectedReason  = body.reason ?? null;
  } else {
    if (body.title         !== undefined) data.title         = body.title;
    if (body.body          !== undefined) data.body          = body.body;
    if (body.issuingEntity !== undefined) data.issuingEntity = body.issuingEntity;
    if (body.entityType    !== undefined) data.entityType    = body.entityType;
    if (body.dateIssued    !== undefined) data.dateIssued    = new Date(body.dateIssued);
    if (body.attachmentUrl !== undefined) data.attachmentUrl = body.attachmentUrl;
    if (body.status        !== undefined) data.status        = body.status;
  }

  const release = await db.pressRelease.update({ where: { id }, data });

  // Notify the submitting chairman of the outcome — this was previously a
  // silent status flip with no signal back to the LGA dashboard beyond the
  // rejectedReason banner, so chairmen had no way to know a submission had
  // even been reviewed.
  if ((body.action === "publish" || body.action === "reject") && release.submittedByRole === "LGA_CHAIRMAN" && release.lgaId) {
    const lga = await db.lGA.findUnique({
      where: { id: release.lgaId },
      select: { email: true, chairmanName: true, lgaName: true },
    });
    if (lga) {
      try {
        if (body.action === "publish") {
          await sendPressReleaseApprovedNotification(lga.email, lga.chairmanName, lga.lgaName, release.title);
        } else {
          await sendPressReleaseRejectedNotification(lga.email, lga.chairmanName, lga.lgaName, release.title, release.rejectedReason);
        }
      } catch (err) {
        console.error(`[press-release] notification failed for ${lga.email}:`, err);
      }
    }
  }

  return NextResponse.json({ release });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  await db.pressRelease.delete({ where: { id } });
  return NextResponse.json({ message: "Deleted." });
}
