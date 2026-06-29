import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { StreamStatus } from "@prisma/client";
import { isAdminRequest } from "@/lib/admin-auth";


export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body   = await req.json().catch(() => ({}));

  const data: Record<string, unknown> = {};
  if (body.status      !== undefined) data.status      = body.status as StreamStatus;
  if (body.title       !== undefined) data.title       = body.title;
  if (body.streamUrl   !== undefined) data.streamUrl   = body.streamUrl;
  if (body.scheduledAt !== undefined) data.scheduledAt = new Date(body.scheduledAt);
  if (body.description !== undefined) data.description = body.description;

  const stream = await db.liveStream.update({ where: { id }, data });
  return NextResponse.json({ stream });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  await db.liveStream.delete({ where: { id } });
  return NextResponse.json({ message: "Deleted." });
}
