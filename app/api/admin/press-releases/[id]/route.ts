import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { PressStatus } from "@prisma/client";

const ADMIN_SECRET = process.env.ADMIN_SECRET ?? "";
const auth = (req: NextRequest) => req.headers.get("x-admin-secret") === ADMIN_SECRET;

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!auth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
  return NextResponse.json({ release });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!auth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  await db.pressRelease.delete({ where: { id } });
  return NextResponse.json({ message: "Deleted." });
}
