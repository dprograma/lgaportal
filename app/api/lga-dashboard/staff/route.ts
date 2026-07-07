import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { getLgaSession } from "@/lib/lga-auth";

// LGA session check via the signed, HttpOnly session cookie (minted after OTP).
async function getLgaId(req: NextRequest): Promise<string | null> {
  return (await getLgaSession(req))?.lgaId ?? null;
}

const createSchema = z.object({
  name:  z.string().min(2, "Name must be at least 2 characters"),
  email: z.email("Valid email required"),
  phone: z.string().optional(),
  role:  z.string().default("STAFF"),
  canPublish: z.boolean(),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export async function GET(req: NextRequest) {
  const lgaId = await getLgaId(req);
  if (!lgaId) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const staff = await db.lGAStaff.findMany({
    where: { lgaId },
    select: {
      id: true, name: true, email: true, phone: true, role: true,
      isActive: true, canPublish: true, createdAt: true,
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ staff });
}

export async function POST(req: NextRequest) {
  const lgaId = await getLgaId(req);
  if (!lgaId) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 422 });
  }

  // Max 2 staff
  const count = await db.lGAStaff.count({ where: { lgaId, isActive: true } });
  if (count >= 2) {
    return NextResponse.json(
      { error: "Maximum of 2 staff members allowed per LGA." },
      { status: 409 }
    );
  }

  // Check email unique
  const existing = await db.lGAStaff.findUnique({ where: { email: parsed.data.email } });
  if (existing) {
    return NextResponse.json({ error: "A staff member with this email already exists." }, { status: 409 });
  }

  // Get chairman id
  const chairman = await db.lGAChairman.findFirst({
    where: { lgaId },
    select: { id: true },
  });
  if (!chairman) return NextResponse.json({ error: "LGA chairman not found." }, { status: 404 });

  const hashed = await bcrypt.hash(parsed.data.password, 12);

  const staff = await db.lGAStaff.create({
    data: {
      lgaId,
      chairmanId: chairman.id,
      name:       parsed.data.name,
      email:      parsed.data.email,
      phone:      parsed.data.phone || null,
      role:       parsed.data.role,
      canPublish: parsed.data.canPublish,
      password:   hashed,
    },
    select: {
      id: true, name: true, email: true, phone: true,
      role: true, isActive: true, canPublish: true, createdAt: true,
    },
  });

  return NextResponse.json({ success: true, staff }, { status: 201 });
}
