import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getLgaSession } from "@/lib/lga-auth";

async function getLgaId(req: NextRequest): Promise<string | null> {
  return (await getLgaSession(req))?.lgaId ?? null;
}

const updateSchema = z.object({
  canPublish: z.boolean().optional(),
  isActive:   z.boolean().optional(),
  role:       z.string().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const lgaId = await getLgaId(req);
  if (!lgaId) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const { id } = await params;
  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 422 });
  }

  const staff = await db.lGAStaff.findFirst({ where: { id, lgaId } });
  if (!staff) return NextResponse.json({ error: "Staff member not found." }, { status: 404 });

  const updated = await db.lGAStaff.update({
    where: { id },
    data: parsed.data,
    select: { id: true, name: true, email: true, isActive: true, canPublish: true },
  });

  return NextResponse.json({ success: true, staff: updated });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const lgaId = await getLgaId(req);
  if (!lgaId) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const { id } = await params;
  const staff = await db.lGAStaff.findFirst({ where: { id, lgaId } });
  if (!staff) return NextResponse.json({ error: "Staff member not found." }, { status: 404 });

  await db.lGAStaff.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
