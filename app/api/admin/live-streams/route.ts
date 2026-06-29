import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { StreamStatus } from "@prisma/client";
import { isAdminRequest } from "@/lib/admin-auth";


export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const streams = await db.liveStream.findMany({
    orderBy: { scheduledAt: "desc" },
    take: 50,
    include: { lga: { select: { lgaName: true, state: true } } },
  });

  return NextResponse.json({ streams });
}

export async function POST(req: NextRequest) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { title, description, streamUrl, scheduledAt, lgaId } = body as {
    title: string; description?: string; streamUrl: string; scheduledAt: string; lgaId?: string;
  };

  if (!title || !streamUrl || !scheduledAt) {
    return NextResponse.json({ error: "title, streamUrl, and scheduledAt are required" }, { status: 400 });
  }

  const stream = await db.liveStream.create({
    data: {
      title,
      description: description ?? null,
      streamUrl,
      scheduledAt: new Date(scheduledAt),
      lgaId: lgaId ?? null,
      status: StreamStatus.UPCOMING,
      createdBy: "ADMIN",
    },
  });

  return NextResponse.json({ stream }, { status: 201 });
}

