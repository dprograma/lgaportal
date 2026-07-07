import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { PressStatus, EntityType } from "@prisma/client";
import { getLgaSession } from "@/lib/lga-auth";

async function getLgaId(req: NextRequest) {
  return (await getLgaSession(req))?.lgaId ?? "";
}

export async function GET(req: NextRequest) {
  const lgaId = await getLgaId(req);
  if (!lgaId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const releases = await db.pressRelease.findMany({
    where: { submittedByLgaId: lgaId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json({ releases });
}

export async function POST(req: NextRequest) {
  const lgaId = await getLgaId(req);
  if (!lgaId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const lga = await db.lGA.findUnique({ where: { id: lgaId }, select: { lgaName: true } });
  if (!lga) return NextResponse.json({ error: "LGA not found" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const { title, body: text, dateIssued, attachmentUrl } = body as {
    title: string; body: string; dateIssued?: string; attachmentUrl?: string;
  };

  if (!title || !text) {
    return NextResponse.json({ error: "title and body are required" }, { status: 400 });
  }

  const release = await db.pressRelease.create({
    data: {
      title,
      body: text,
      issuingEntity: `${lga!.lgaName} LGA`,
      entityType: EntityType.LGA,
      lgaId,
      submittedByLgaId: lgaId,
      submittedByRole: "LGA_CHAIRMAN",
      dateIssued: dateIssued ? new Date(dateIssued) : new Date(),
      attachmentUrl: attachmentUrl ?? null,
      status: PressStatus.PENDING,
    },
  });

  return NextResponse.json({ release }, { status: 201 });
}
