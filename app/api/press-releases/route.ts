import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { PressStatus, EntityType } from "@prisma/client";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const q          = searchParams.get("q") ?? "";
  const entityType = searchParams.get("entityType") as EntityType | null;
  const lgaId      = searchParams.get("lgaId") ?? undefined;
  const dateFrom   = searchParams.get("dateFrom") ? new Date(searchParams.get("dateFrom")!) : undefined;
  const dateTo     = searchParams.get("dateTo")   ? new Date(searchParams.get("dateTo")!)   : undefined;
  const take       = Math.min(Number(searchParams.get("limit") ?? 20), 50);
  const skip       = Number(searchParams.get("offset") ?? 0);

  const where = {
    status: PressStatus.PUBLISHED,
    ...(q          ? { OR: [{ title: { contains: q, mode: "insensitive" as const } }, { body: { contains: q, mode: "insensitive" as const } }, { issuingEntity: { contains: q, mode: "insensitive" as const } }] } : {}),
    ...(entityType ? { entityType } : {}),
    ...(lgaId      ? { lgaId } : {}),
    ...(dateFrom   ? { dateIssued: { gte: dateFrom } } : {}),
    ...(dateTo     ? { dateIssued: { lte: dateTo   } } : {}),
  };

  const [releases, total] = await Promise.all([
    db.pressRelease.findMany({
      where,
      orderBy: { dateIssued: "desc" },
      take,
      skip,
      select: {
        id: true, title: true, issuingEntity: true, entityType: true,
        dateIssued: true, status: true, attachmentUrl: true,
        lga: { select: { lgaName: true, state: true } },
      },
    }),
    db.pressRelease.count({ where }),
  ]);

  return NextResponse.json({ releases, total });
}
