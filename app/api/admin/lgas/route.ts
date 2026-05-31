import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

const ADMIN_SECRET = process.env.ADMIN_SECRET ?? "";

function isAdmin(req: NextRequest) {
  const secret = req.headers.get("x-admin-secret");
  return ADMIN_SECRET && secret === ADMIN_SECRET;
}

export async function GET(req: NextRequest) {
  if (!isAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") ?? undefined;
  const search = searchParams.get("search") ?? undefined;
  const take   = Math.min(parseInt(searchParams.get("limit") ?? "25"), 100);
  const skip   = parseInt(searchParams.get("offset") ?? "0");

  const where: Record<string, unknown> = {};
  if (status && status !== "ALL") where.status = status;
  if (search) where.lgaName = { contains: search, mode: "insensitive" };

  const [lgas, total] = await Promise.all([
    db.lGA.findMany({
      where,
      select: {
        id: true, lgaName: true, state: true, chairmanName: true,
        email: true, phone: true, status: true, isVerified: true,
        tenureStatus: true, freeUntil: true, createdAt: true,
        _count: { select: { verificationDocs: true } },
      },
      orderBy: { createdAt: "desc" },
      take,
      skip,
    }),
    db.lGA.count({ where }),
  ]);

  return NextResponse.json({ lgas, total });
}
