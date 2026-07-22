import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { isAdminRequest } from "@/lib/admin-auth";

// Profile fields an admin may correct. Deliberately excludes email, password,
// status, isVerified, subscription/tenure fields — those are account/login
// and lifecycle state, not the "official record" data this endpoint is for.
const profileSchema = z.object({
  lgaName:       z.string().min(2).max(100).optional(),
  state:         z.string().min(2).max(50).optional(),
  chairmanName:  z.string().min(2).max(100).optional(),
  phone:         z.string().min(5).max(20).optional(),
  officeAddress: z.string().min(5).max(300).optional(),
  population:    z.string().max(50).nullable().optional(),
  description:   z.string().max(2000).nullable().optional(),
  sectors:       z.array(z.string()).optional(),
  logoUrl:       z.string().url().nullable().optional(),
});

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const { id } = await params;

  const lga = await db.lGA.findUnique({
    where: { id },
    select: {
      id: true, lgaName: true, state: true, chairmanName: true, email: true, phone: true,
      officeAddress: true, population: true, description: true, sectors: true, logoUrl: true,
      status: true, isVerified: true,
    },
  });
  if (!lga) return NextResponse.json({ error: "LGA not found." }, { status: 404 });

  return NextResponse.json({ lga });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const { id } = await params;

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = profileSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 422 });
  }

  const existing = await db.lGA.findUnique({ where: { id }, select: { id: true } });
  if (!existing) return NextResponse.json({ error: "LGA not found." }, { status: 404 });

  const lga = await db.lGA.update({ where: { id }, data: parsed.data });
  return NextResponse.json({ lga });
}
