import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";

const createSchema = z.object({
  lgaId:           z.string().cuid(),
  wardName:        z.string().min(1, "Ward name is required").max(100),
  wardNumber:      z.number().int().positive().optional(),
  councillorName:  z.string().min(2, "Councillor name is required").max(100),
  councillorEmail: z.string().email().optional().or(z.literal("")),
  councillorPhone: z.string().optional(),
  councillorImage: z.string().url().optional().or(z.literal("")),
  description:     z.string().max(1000).optional(),
  population:      z.string().optional(),
  isActive:        z.boolean().default(true),
});

const updateSchema = createSchema.partial().extend({
  id: z.string().cuid(),
});

// GET /api/lgas/wards?lgaId=xxx  — public listing of wards for an LGA
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lgaId = searchParams.get("lgaId");

  if (!lgaId) {
    return NextResponse.json({ error: "lgaId is required." }, { status: 400 });
  }

  const wards = await db.ward.findMany({
    where: { lgaId },
    orderBy: [{ wardNumber: "asc" }, { wardName: "asc" }],
  });

  return NextResponse.json({ wards });
}

// POST /api/lgas/wards  — LGA admin creates a ward
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = createSchema.parse(body);

    const lga = await db.lGA.findUnique({ where: { id: data.lgaId } });
    if (!lga) {
      return NextResponse.json({ error: "LGA not found." }, { status: 404 });
    }

    const ward = await db.ward.create({
      data: {
        lgaId:           data.lgaId,
        wardName:        data.wardName,
        wardNumber:      data.wardNumber ?? null,
        councillorName:  data.councillorName,
        councillorEmail: data.councillorEmail || null,
        councillorPhone: data.councillorPhone ?? null,
        councillorImage: data.councillorImage || null,
        description:     data.description ?? null,
        population:      data.population ?? null,
        isActive:        data.isActive,
      },
    });

    return NextResponse.json({ success: true, ward }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0].message }, { status: 422 });
    }
    console.error("Ward create error:", err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}

// PUT /api/lgas/wards  — LGA admin updates a ward
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, ...rest } = updateSchema.parse(body);

    const ward = await db.ward.update({
      where: { id },
      data: rest,
    });

    return NextResponse.json({ success: true, ward });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0].message }, { status: 422 });
    }
    console.error("Ward update error:", err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}

// DELETE /api/lgas/wards?id=xxx
export async function DELETE(req: NextRequest) {
  const id = new URL(req.url).searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id is required." }, { status: 400 });
  }

  await db.ward.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
