import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

const ADMIN_SECRET = process.env.ADMIN_SECRET ?? "";
function auth(req: NextRequest) { return req.headers.get("x-admin-secret") === ADMIN_SECRET; }

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!auth(req)) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const { id } = await params;

  let body: { publish?: boolean; amount?: number; source?: string } = {};
  try { body = await req.json(); } catch { /* empty body is ok */ }

  const data: Record<string, unknown> = { updatedAt: new Date() };
  if (typeof body.publish === "boolean") {
    data.isPublished = body.publish;
    data.publishedAt = body.publish ? new Date() : null;
  }
  if (typeof body.amount === "number") data.amount = BigInt(Math.round(body.amount * 100));
  if (body.source !== undefined) data.source = body.source;

  const record = await db.allocationRecord.update({ where: { id }, data });
  return NextResponse.json({ record: { ...record, amount: record.amount.toString() } });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!auth(req)) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const { id } = await params;
  await db.allocationRecord.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
