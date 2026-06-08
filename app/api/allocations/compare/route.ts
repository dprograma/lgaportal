import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  // lgas=LGA1,LGA2,... or states=State1,State2,...
  const lgasParam   = searchParams.get("lgas")   ?? "";
  const statesParam = searchParams.get("states") ?? "";
  const year        = searchParams.get("year")  ? Number(searchParams.get("year"))  : undefined;
  const month       = searchParams.get("month") ? Number(searchParams.get("month")) : undefined;

  const lgaNames  = lgasParam  ? lgasParam.split(",").slice(0, 5).map((s) => s.trim()) : [];
  const stateNames = statesParam ? statesParam.split(",").slice(0, 5).map((s) => s.trim()) : [];

  if (lgaNames.length === 0 && stateNames.length === 0) {
    return NextResponse.json({ error: "Provide lgas or states query param." }, { status: 400 });
  }

  const where: Record<string, unknown> = { isPublished: true };
  if (year)  where.year  = year;
  if (month) where.month = month;

  if (lgaNames.length > 0) {
    where.lgaName = { in: lgaNames, mode: "insensitive" };
  } else {
    where.state = { in: stateNames, mode: "insensitive" };
  }

  const records = await db.allocationRecord.findMany({
    where,
    orderBy: [{ year: "asc" }, { month: "asc" }],
  });

  // Group by name for chart
  const grouped: Record<string, { name: string; total: bigint; byMonth: { month: number; year: number; amount: bigint }[] }> = {};
  for (const r of records) {
    const key = lgaNames.length > 0 ? r.lgaName : r.state;
    if (!grouped[key]) grouped[key] = { name: key, total: BigInt(0), byMonth: [] };
    grouped[key].total += r.amount;
    grouped[key].byMonth.push({ month: r.month, year: r.year, amount: r.amount });
  }

  const result = Object.values(grouped).map((g) => ({
    name: g.name,
    total: g.total.toString(),
    byMonth: g.byMonth.map((m) => ({ ...m, amount: m.amount.toString() })),
  }));

  return NextResponse.json({ data: result });
}
