import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { PressStatus, EntityType } from "@prisma/client";

const ADMIN_SECRET = process.env.ADMIN_SECRET ?? "";
const auth = (req: NextRequest) => req.headers.get("x-admin-secret") === ADMIN_SECRET;

export async function GET(req: NextRequest) {
  if (!auth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const status     = searchParams.get("status") as PressStatus | null;
  const q          = searchParams.get("q") ?? "";
  const take       = Math.min(Number(searchParams.get("limit") ?? 25), 100);
  const skip       = Number(searchParams.get("offset") ?? 0);

  const where = {
    ...(status ? { status } : {}),
    ...(q      ? { OR: [{ title: { contains: q, mode: "insensitive" as const } }, { issuingEntity: { contains: q, mode: "insensitive" as const } }] } : {}),
  };

  const [releases, total] = await Promise.all([
    db.pressRelease.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take,
      skip,
      include: { lga: { select: { lgaName: true, state: true } } },
    }),
    db.pressRelease.count({ where }),
  ]);

  return NextResponse.json({ releases, total });
}

export async function POST(req: NextRequest) {
  if (!auth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { title, body: text, issuingEntity, entityType, lgaId, dateIssued, attachmentUrl } = body as {
    title: string; body: string; issuingEntity: string;
    entityType?: EntityType; lgaId?: string; dateIssued?: string; attachmentUrl?: string;
  };

  if (!title || !text || !issuingEntity) {
    return NextResponse.json({ error: "title, body, and issuingEntity are required" }, { status: 400 });
  }

  const release = await db.pressRelease.create({
    data: {
      title, body: text, issuingEntity,
      entityType: entityType ?? EntityType.LGA,
      lgaId: lgaId ?? null,
      dateIssued: dateIssued ? new Date(dateIssued) : new Date(),
      attachmentUrl: attachmentUrl ?? null,
      status: PressStatus.PUBLISHED,
      submittedByRole: "ADMIN",
      approvedAt: new Date(),
    },
  });

  return NextResponse.json({ release }, { status: 201 });
}
