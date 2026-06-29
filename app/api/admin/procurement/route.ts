import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAdminRequest } from "@/lib/admin-auth";


export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const lgaId  = searchParams.get("lgaId") ?? undefined;
  const search = searchParams.get("search") ?? "";
  const take   = Math.min(Number(searchParams.get("limit") ?? 25), 100);
  const skip   = Number(searchParams.get("offset") ?? 0);

  const where = {
    ...(lgaId  ? { lgaId } : {}),
    ...(search ? {
      OR: [
        { title:      { contains: search, mode: "insensitive" as const } },
        { contractor: { contains: search, mode: "insensitive" as const } },
      ],
    } : {}),
  };

  const [contracts, total] = await Promise.all([
    db.procurementContract.findMany({
      where,
      orderBy: { awardDate: "desc" },
      take,
      skip,
      include: { lga: { select: { lgaName: true, state: true } } },
    }),
    db.procurementContract.count({ where }),
  ]);

  return NextResponse.json({
    contracts: contracts.map((c) => ({ ...c, value: c.value.toString() })),
    total,
  });
}

export async function POST(req: NextRequest) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { lgaId, title, contractor, value, awardDate, scope, source } = body as {
    lgaId: string; title: string; contractor: string;
    value: string | number; awardDate: string; scope: string; source?: string;
  };

  if (!lgaId || !title || !contractor || !value || !awardDate || !scope) {
    return NextResponse.json({ error: "All fields are required" }, { status: 400 });
  }

  const contract = await db.procurementContract.create({
    data: {
      lgaId, title, contractor,
      value: BigInt(value),
      awardDate: new Date(awardDate),
      scope,
      source: source ?? "MANUAL",
    },
  });

  return NextResponse.json({ contract: { ...contract, value: contract.value.toString() } }, { status: 201 });
}

