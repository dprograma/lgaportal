import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const lga = await db.lGA.findUnique({
    where: { id, status: "APPROVED" },
    select: {
      id: true, lgaName: true, state: true, chairmanName: true, isVerified: true,
      posts: {
        where: { status: "PUBLISHED" },
        orderBy: { createdAt: "desc" },
        take: 3,
        select: { id: true, title: true, imageUrl: true, createdAt: true },
      },
      _count: { select: { posts: true, wards: true } },
    },
  });

  if (!lga) return NextResponse.json({ error: "LGA not found." }, { status: 404 });

  // Latest allocation
  const allocation = await db.allocationRecord.findFirst({
    where: { lgaName: lga.lgaName, state: lga.state, isPublished: true },
    orderBy: [{ year: "desc" }, { month: "desc" }],
    select: { amount: true, month: true, year: true },
  });

  // Citizen count
  const citizenCount = await db.user.count({
    where: {
      lga:   { equals: lga.lgaName, mode: "insensitive" },
      state: { equals: lga.state,   mode: "insensitive" },
    },
  });

  return NextResponse.json({
    lga: {
      ...lga,
      citizenCount,
      latestAllocation: allocation
        ? { amount: allocation.amount.toString(), month: allocation.month, year: allocation.year }
        : null,
    },
  });
}
