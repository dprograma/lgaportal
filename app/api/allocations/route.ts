import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const state    = searchParams.get("state")    ?? undefined;
  const lgaName  = searchParams.get("lga")      ?? undefined;
  const search   = searchParams.get("search")   ?? undefined;
  const month    = searchParams.get("month")    ? Number(searchParams.get("month"))    : undefined;
  const year     = searchParams.get("year")     ? Number(searchParams.get("year"))     : undefined;
  const yearFrom = searchParams.get("yearFrom") ? Number(searchParams.get("yearFrom")) : undefined;
  const yearTo   = searchParams.get("yearTo")   ? Number(searchParams.get("yearTo"))   : undefined;
  const limit    = Math.min(Number(searchParams.get("limit")  ?? "100"), 500);
  const offset   = Number(searchParams.get("offset") ?? "0");

  const where: Record<string, unknown> = { isPublished: true };
  if (state)   where.state   = { equals: state,   mode: "insensitive" };
  if (lgaName) where.lgaName = { contains: lgaName, mode: "insensitive" };
  if (search)  where.OR = [
    { lgaName: { contains: search, mode: "insensitive" } },
    { state:   { contains: search, mode: "insensitive" } },
  ];
  if (month)   where.month = month;
  if (year)    where.year  = year;
  if (yearFrom || yearTo) {
    where.year = {
      ...(yearFrom ? { gte: yearFrom } : {}),
      ...(yearTo   ? { lte: yearTo   } : {}),
    };
  }

  const [records, total] = await Promise.all([
    db.allocationRecord.findMany({
      where,
      orderBy: [{ year: "desc" }, { month: "desc" }, { state: "asc" }, { lgaName: "asc" }],
      take: limit,
      skip: offset,
    }),
    db.allocationRecord.count({ where }),
  ]);

  // Distinct years for filters
  const years = await db.allocationRecord.findMany({
    where: { isPublished: true },
    select: { year: true },
    distinct: ["year"],
    orderBy: { year: "desc" },
  });

  return NextResponse.json({
    records: records.map((r) => ({
      ...r,
      amount: r.amount.toString(),
    })),
    total,
    years: years.map((y) => y.year),
  });
}
