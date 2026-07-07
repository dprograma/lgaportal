import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { getLgaSession, requireChairman } from "@/lib/lga-auth";

const updateSchema = z.object({
  phone:         z.string().min(7).max(20).optional(),
  officeAddress: z.string().min(5).max(200).optional(),
  population:    z.string().max(50).optional().nullable(),
  description:   z.string().max(1000).optional().nullable(),
  sectors:       z.array(z.string()).min(1).optional(),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword:     z.string().min(8),
});

// GET /api/lga-dashboard/profile — full LGA profile for settings page
export async function GET(req: NextRequest) {
  const lgaSession = await getLgaSession(req);
  if (!lgaSession) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const lgaId = lgaSession.lgaId;

  const lga = await db.lGA.findUnique({
    where: { id: lgaId },
    select: {
      id: true, lgaName: true, state: true, chairmanName: true,
      email: true, phone: true, officeAddress: true,
      population: true, description: true, sectors: true,
      status: true, isVerified: true,
    },
  });

  if (!lga) return NextResponse.json({ error: "LGA not found." }, { status: 404 });
  return NextResponse.json({ lga });
}

// PATCH /api/lga-dashboard/profile — update LGA info or change password
export async function PATCH(req: NextRequest) {
  const lgaSession = await requireChairman(req);
  if (lgaSession instanceof NextResponse) return lgaSession;
  const lgaId = lgaSession.lgaId;

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  // Password change branch
  if ((body as Record<string, unknown>).currentPassword !== undefined) {
    const parsed = passwordSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 422 });
    }

    const chairman = await db.lGAChairman.findUnique({ where: { lgaId } });
    if (!chairman?.password) return NextResponse.json({ error: "Chairman account not found." }, { status: 404 });

    const valid = await bcrypt.compare(parsed.data.currentPassword, chairman.password);
    if (!valid) return NextResponse.json({ error: "Current password is incorrect." }, { status: 400 });

    const hashed = await bcrypt.hash(parsed.data.newPassword, 12);
    await db.lGAChairman.update({ where: { id: chairman.id }, data: { password: hashed } });
    return NextResponse.json({ success: true, message: "Password updated." });
  }

  // Profile update branch
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 422 });
  }

  const lga = await db.lGA.update({
    where: { id: lgaId },
    data: {
      ...(parsed.data.phone         !== undefined && { phone:         parsed.data.phone }),
      ...(parsed.data.officeAddress !== undefined && { officeAddress: parsed.data.officeAddress }),
      ...(parsed.data.population    !== undefined && { population:    parsed.data.population }),
      ...(parsed.data.description   !== undefined && { description:   parsed.data.description }),
      ...(parsed.data.sectors       !== undefined && { sectors:       parsed.data.sectors }),
    },
    select: { id: true, lgaName: true, phone: true, officeAddress: true, population: true, description: true, sectors: true },
  });

  return NextResponse.json({ success: true, lga });
}
