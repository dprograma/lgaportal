import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { isAdminRequest } from "@/lib/admin-auth";

const rowSchema = z.object({
  lgaName:         z.string().min(1, "lgaName is required"),
  state:           z.string().min(1, "state is required"),
  wardName:        z.string().min(1, "wardName is required").max(100),
  wardNumber:      z.number().int().positive().optional(),
  councillorName:  z.string().min(2, "councillorName is required").max(100),
  councillorEmail: z.string().email().optional().or(z.literal("")),
  councillorPhone: z.string().optional(),
  description:     z.string().max(1000).optional(),
  population:      z.string().optional(),
});

// GET /api/admin/wards — list wards across every LGA, with the owning LGA's
// name/state joined in for display and export.
export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const state  = searchParams.get("state")  ?? undefined;
  const search = searchParams.get("search") ?? undefined; // matches ward name or LGA name
  const limit  = Math.min(Number(searchParams.get("limit")  ?? "30"), 200);
  const offset = Number(searchParams.get("offset") ?? "0");

  const where: Record<string, unknown> = {};
  if (state)  where.lga = { state: { equals: state, mode: "insensitive" } };
  if (search) {
    where.OR = [
      { wardName: { contains: search, mode: "insensitive" } },
      { lga: { lgaName: { contains: search, mode: "insensitive" } } },
    ];
  }

  const [wards, total] = await Promise.all([
    db.ward.findMany({
      where,
      include: { lga: { select: { lgaName: true, state: true } } },
      orderBy: [{ lga: { state: "asc" } }, { lga: { lgaName: "asc" } }, { wardNumber: "asc" }],
      take: limit,
      skip: offset,
    }),
    db.ward.count({ where }),
  ]);

  return NextResponse.json({ wards, total });
}

// POST /api/admin/wards — create ward(s) for an EXISTING LGA (single object or
// array). Each row is resolved to an lgaId via lgaName+state; rows for an LGA
// that isn't registered are skipped and reported back, never auto-created.
export async function POST(req: NextRequest) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const isBulk = Array.isArray(body);
  const parsed = isBulk ? z.array(rowSchema).safeParse(body) : rowSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 422 });
  }
  const rows = isBulk ? (parsed.data as z.infer<typeof rowSchema>[]) : [parsed.data as z.infer<typeof rowSchema>];

  let created = 0;
  const skipped: { row: number; reason: string }[] = [];

  for (let i = 0; i < rows.length; i++) {
    const { lgaName, state, ...fields } = rows[i];

    const lga = await db.lGA.findFirst({
      where: { lgaName: { equals: lgaName, mode: "insensitive" }, state: { equals: state, mode: "insensitive" } },
      select: { id: true },
    });
    if (!lga) {
      skipped.push({ row: i + 1, reason: `No registered LGA matching "${lgaName}, ${state}".` });
      continue;
    }

    try {
      await db.ward.upsert({
        where: { lgaId_wardName: { lgaId: lga.id, wardName: fields.wardName } },
        update: {
          wardNumber:      fields.wardNumber ?? null,
          councillorName:  fields.councillorName,
          councillorEmail: fields.councillorEmail || null,
          councillorPhone: fields.councillorPhone || null,
          description:     fields.description || null,
          population:      fields.population || null,
        },
        create: {
          lgaId:           lga.id,
          wardName:        fields.wardName,
          wardNumber:      fields.wardNumber ?? null,
          councillorName:  fields.councillorName,
          councillorEmail: fields.councillorEmail || null,
          councillorPhone: fields.councillorPhone || null,
          description:     fields.description || null,
          population:      fields.population || null,
        },
      });
      created++;
    } catch (e) {
      skipped.push({ row: i + 1, reason: e instanceof Error ? e.message : "Failed to save." });
    }
  }

  return NextResponse.json({ created, skipped, total: rows.length }, { status: 201 });
}
