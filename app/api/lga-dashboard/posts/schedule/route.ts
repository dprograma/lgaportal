import { NextRequest, NextResponse } from "next/server";
import { db as prisma } from "@/lib/db";
import { getLgaSession } from "@/lib/lga-auth";

export async function PATCH(req: NextRequest) {
  const lgaSession = await getLgaSession(req);
  if (!lgaSession) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const lgaId = lgaSession.lgaId;

  const body = await req.json().catch(() => ({}));
  const { postId, scheduledAt } = body as { postId?: string; scheduledAt?: string };

  if (!postId || !scheduledAt) {
    return NextResponse.json({ error: "postId and scheduledAt are required" }, { status: 400 });
  }

  const schedDate = new Date(scheduledAt);
  if (isNaN(schedDate.getTime()) || schedDate <= new Date()) {
    return NextResponse.json({ error: "scheduledAt must be a future date" }, { status: 400 });
  }

  const post = await prisma.post.findFirst({ where: { id: postId, lgaId } });
  if (!post) return NextResponse.json({ error: "Post not found" }, { status: 404 });

  const updated = await prisma.post.update({
    where: { id: postId },
    data: { scheduledAt: schedDate, status: "DRAFT" },
    select: { id: true, title: true, scheduledAt: true, status: true },
  });

  return NextResponse.json({ message: "Post scheduled.", post: updated });
}

export async function DELETE(req: NextRequest) {
  const lgaSession = await getLgaSession(req);
  if (!lgaSession) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const lgaId = lgaSession.lgaId;

  const { searchParams } = req.nextUrl;
  const postId = searchParams.get("postId");
  if (!postId) return NextResponse.json({ error: "postId is required" }, { status: 400 });

  const post = await prisma.post.findFirst({ where: { id: postId, lgaId } });
  if (!post) return NextResponse.json({ error: "Post not found" }, { status: 404 });

  await prisma.post.update({ where: { id: postId }, data: { scheduledAt: null } });

  return NextResponse.json({ message: "Schedule cleared." });
}
