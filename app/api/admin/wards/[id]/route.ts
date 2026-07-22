import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { isAdminRequest } from "@/lib/admin-auth";

const updateSchema = z.object({
  wardName:        z.string().min(1).max(100).optional(),
  wardNumber:      z.number().int().positive().nullable().optional(),
  councillorName:  z.string().min(2).max(100).optional(),
  councillorEmail: z.string().email().nullable().optional(),
  councillorPhone: z.string().nullable().optional(),
  description:     z.string().max(1000).nullable().optional(),
  population:      z.string().nullable().optional(),
  isActive:        z.boolean().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const { id } = await params;

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 422 });

  const existing = await db.ward.findUnique({ where: { id }, select: { id: true } });
  if (!existing) return NextResponse.json({ error: "Ward not found." }, { status: 404 });

  const ward = await db.ward.update({ where: { id }, data: parsed.data });
  return NextResponse.json({ ward });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const { id } = await params;

  const existing = await db.ward.findUnique({ where: { id }, select: { id: true } });
  if (!existing) return NextResponse.json({ error: "Ward not found." }, { status: 404 });

  await db.ward.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
