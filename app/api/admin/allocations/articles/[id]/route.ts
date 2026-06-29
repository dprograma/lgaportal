import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAdminRequest } from "@/lib/admin-auth";


export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const article = await db.allocationArticle.findUnique({ where: { id } });
  if (!article) return NextResponse.json({ error: "Not found." }, { status: 404 });
  return NextResponse.json({ article });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const { id } = await params;
  let body: Record<string, unknown> = {};
  try { body = await req.json(); } catch { /* ok */ }

  const data: Record<string, unknown> = { updatedAt: new Date() };
  if (body.title)   data.title   = body.title;
  if (body.slug)    data.slug    = body.slug;
  if (body.content) data.content = body.content;
  if (body.month !== undefined)       data.month      = body.month ?? null;
  if (body.year  !== undefined)       data.year       = body.year  ?? null;
  if (body.coverImage !== undefined)  data.coverImage = body.coverImage;
  if (body.attachments)               data.attachments= body.attachments;
  if (body.scheduledAt !== undefined) data.scheduledAt= body.scheduledAt ? new Date(body.scheduledAt as string) : null;
  if (body.status) {
    data.status = body.status;
    if (body.status === "PUBLISHED") data.publishedAt = new Date();
  }

  const article = await db.allocationArticle.update({ where: { id }, data });
  return NextResponse.json({ article });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const { id } = await params;
  await db.allocationArticle.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
