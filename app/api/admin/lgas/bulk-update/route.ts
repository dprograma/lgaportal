import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { isAdminRequest } from "@/lib/admin-auth";

// Bulk-correct profile fields on ALREADY-REGISTERED LGAs. This never creates
// a new LGA (that would also create a login account, which is out of scope
// here) — a row with no matching existing LGA is reported back as skipped.
const rowSchema = z.object({
  email:         z.string().email().optional(),
  lgaName:       z.string().min(1).optional(),
  state:         z.string().min(1).optional(),
  chairmanName:  z.string().min(2).max(100).optional(),
  phone:         z.string().min(5).max(20).optional(),
  officeAddress: z.string().min(5).max(300).optional(),
  population:    z.string().max(50).optional(),
  description:   z.string().max(2000).optional(),
  logoUrl:       z.string().url().optional(),
}).refine(
  (r) => r.email || (r.lgaName && r.state),
  { message: "Each row needs either an email or both lgaName and state to identify the LGA." }
);

export async function POST(req: NextRequest) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }
  if (!Array.isArray(body)) {
    return NextResponse.json({ error: "Expected an array of rows." }, { status: 400 });
  }

  const parsed = z.array(rowSchema).safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 422 });
  }

  let updated = 0;
  const skipped: { row: number; reason: string }[] = [];

  for (let i = 0; i < parsed.data.length; i++) {
    const row = parsed.data[i];
    const { email, lgaName, state, ...fields } = row;

    const existing = email
      ? await db.lGA.findUnique({ where: { email }, select: { id: true } })
      : await db.lGA.findFirst({
          where: { lgaName: { equals: lgaName, mode: "insensitive" }, state: { equals: state, mode: "insensitive" } },
          select: { id: true },
        });

    if (!existing) {
      skipped.push({ row: i + 1, reason: "No matching registered LGA found." });
      continue;
    }

    const data: Record<string, unknown> = { ...fields };
    if (lgaName) data.lgaName = lgaName;
    if (state) data.state = state;
    if (Object.keys(data).length === 0) {
      skipped.push({ row: i + 1, reason: "No fields to update." });
      continue;
    }

    await db.lGA.update({ where: { id: existing.id }, data });
    updated++;
  }

  return NextResponse.json({ updated, skipped, total: parsed.data.length });
}
