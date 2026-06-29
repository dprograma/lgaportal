import { NextRequest, NextResponse } from "next/server";
import { db as prisma } from "@/lib/db";
import { Prisma, $Enums } from "@prisma/client";
import { isAdminRequest } from "@/lib/admin-auth";



export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const search  = searchParams.get("search") ?? "";
  const role    = searchParams.get("role") ?? "ALL";
  const status  = searchParams.get("status") ?? "ALL"; // ALL | ACTIVE | BANNED | SUSPENDED
  const limit   = Math.min(Number(searchParams.get("limit") ?? 25), 100);
  const offset  = Number(searchParams.get("offset") ?? 0);

  const where: Prisma.UserWhereInput = {};
  if (search) {
    where.OR = [
      { name:  { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
    ];
  }
  if (role !== "ALL") where.role = role as $Enums.UserRole;
  if (status === "ACTIVE")    { where.isActive = true;  where.isBanned = false; }
  if (status === "BANNED")    { where.isBanned = true; }
  if (status === "SUSPENDED") { where.suspendedUntil = { gt: new Date() }; }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
      select: {
        id: true, name: true, email: true, role: true, state: true, lga: true,
        isActive: true, isBanned: true, banReason: true, suspendedUntil: true,
        createdAt: true, emailVerified: true,
        _count: { select: { reactions: true, comments: true } },
      },
    }),
    prisma.user.count({ where }),
  ]);

  return NextResponse.json({ users, total });
}

