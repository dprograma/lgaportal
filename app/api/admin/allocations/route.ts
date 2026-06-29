import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";
import { isAdminRequest } from "@/lib/admin-auth";



const recordSchema = z.object({
  lgaName: z.string().min(1),
  state:   z.string().min(1),
  month:   z.number().int().min(1).max(12),
  year:    z.number().int().min(2020).max(2100),
  amount:  z.number().positive(), // naira — store as kobo (×100)
  source:  z.string().optional(),
});

const bulkSchema = z.array(recordSchema);

export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const month  = searchParams.get("month") ? Number(searchParams.get("month")) : undefined;
  const year   = searchParams.get("year")  ? Number(searchParams.get("year"))  : undefined;
  const state  = searchParams.get("state") ?? undefined;
  const limit  = Math.min(Number(searchParams.get("limit")  ?? "50"), 200);
  const offset = Number(searchParams.get("offset") ?? "0");

  const where: Record<string, unknown> = {};
  if (month) where.month = month;
  if (year)  where.year  = year;
  if (state) where.state = { equals: state, mode: "insensitive" };

  const [records, total] = await Promise.all([
    db.allocationRecord.findMany({
      where,
      orderBy: [{ year: "desc" }, { month: "desc" }, { state: "asc" }],
      take: limit, skip: offset,
    }),
    db.allocationRecord.count({ where }),
  ]);

  return NextResponse.json({
    records: records.map((r) => ({ ...r, amount: r.amount.toString() })),
    total,
  });
}

export async function POST(req: NextRequest) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  // Support single or bulk
  const isBulk = Array.isArray(body);
  const parsed = isBulk ? bulkSchema.safeParse(body) : recordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 422 });
  }

  const items = isBulk ? (parsed.data as z.infer<typeof recordSchema>[]) : [parsed.data as z.infer<typeof recordSchema>];

  const created = await db.$transaction(
    items.map((item) =>
      db.allocationRecord.upsert({
        where: { lgaName_state_month_year: { lgaName: item.lgaName, state: item.state, month: item.month, year: item.year } },
        update: { amount: BigInt(Math.round(item.amount * 100)), source: item.source ?? null, updatedAt: new Date() },
        create: { lgaName: item.lgaName, state: item.state, month: item.month, year: item.year, amount: BigInt(Math.round(item.amount * 100)), source: item.source ?? null },
      })
    )
  );

  return NextResponse.json({ created: created.length, message: `${created.length} record(s) upserted.` }, { status: 201 });
}

