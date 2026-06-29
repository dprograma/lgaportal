import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { sendLGARejectionEmail } from "@/lib/email";
import { isAdminRequest } from "@/lib/admin-auth";

const schema = z.object({ reason: z.string().min(10, "Reason must be at least 10 characters") });

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { id } = await params;
  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 422 });
  }

  const lga = await db.lGA.findUnique({
    where: { id },
    select: { id: true, lgaName: true, chairmanName: true, email: true },
  });
  if (!lga) return NextResponse.json({ error: "LGA not found." }, { status: 404 });

  await db.lGA.update({
    where: { id },
    data: { status: "REJECTED" },
  });

  await db.lGAVerificationDoc.updateMany({
    where: { lgaId: id, status: "PENDING" },
    data: { status: "REJECTED" },
  });

  try {
    await sendLGARejectionEmail(lga.email, lga.chairmanName, lga.lgaName, parsed.data.reason);
  } catch (err) {
    console.error("[reject] email failed:", err);
  }

  return NextResponse.json({ success: true, message: `${lga.lgaName} rejected.` });
}
