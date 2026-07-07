import { NextRequest, NextResponse } from "next/server";
import { db as prisma } from "@/lib/db";
import { getLgaSession } from "@/lib/lga-auth";

export async function GET(req: NextRequest) {
  const lgaSession = await getLgaSession(req);
  if (!lgaSession) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const lgaId = lgaSession.lgaId;

  const lga = await prisma.lGA.findUnique({
    where: { id: lgaId },
    select: { lgaName: true, state: true },
  });
  if (!lga) return NextResponse.json({ error: "LGA not found" }, { status: 404 });

  const [total, active, recent] = await Promise.all([
    prisma.user.count({
      where: { role: "CITIZEN", lga: lga.lgaName, state: lga.state },
    }),
    prisma.user.count({
      where: { role: "CITIZEN", lga: lga.lgaName, state: lga.state, isActive: true, isBanned: false },
    }),
    prisma.user.count({
      where: {
        role: "CITIZEN",
        lga: lga.lgaName,
        state: lga.state,
        createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      },
    }),
  ]);

  return NextResponse.json({ total, active, recent, lgaName: lga.lgaName, state: lga.state });
}
