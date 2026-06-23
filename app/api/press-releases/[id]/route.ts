import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { PressStatus } from "@prisma/client";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const release = await db.pressRelease.findFirst({
    where: { id, status: PressStatus.PUBLISHED },
    include: { lga: { select: { lgaName: true, state: true } } },
  });

  if (!release) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ release });
}
