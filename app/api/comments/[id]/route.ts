import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/auth";

// PATCH /api/comments/[id] — edit own comment within 24h
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Login required." }, { status: 401 });
  }

  const { id } = await params;

  const comment = await db.comment.findUnique({ where: { id } });
  if (!comment) return NextResponse.json({ error: "Comment not found." }, { status: 404 });

  if (comment.userId !== session.user.id) {
    return NextResponse.json({ error: "You can only edit your own comments." }, { status: 403 });
  }

  const ageMs = Date.now() - new Date(comment.createdAt).getTime();
  if (ageMs > 24 * 60 * 60 * 1000) {
    return NextResponse.json({ error: "Comments can only be edited within 24 hours." }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { content } = body as { content?: string };
  if (!content || content.trim().length === 0) {
    return NextResponse.json({ error: "Content cannot be empty." }, { status: 422 });
  }
  if (content.length > 500) {
    return NextResponse.json({ error: "Comment must not exceed 500 characters." }, { status: 422 });
  }

  const updated = await db.comment.update({
    where: { id },
    data: { content: content.trim(), editedAt: new Date() },
    select: {
      id: true,
      content: true,
      createdAt: true,
      editedAt: true,
      user: { select: { id: true, name: true, image: true } },
    },
  });

  return NextResponse.json({ comment: updated });
}

// DELETE /api/comments/[id] — soft delete (owner or admin)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Login required." }, { status: 401 });
  }

  const { id } = await params;
  const isAdmin = req.headers.get("x-admin-secret") === process.env.ADMIN_SECRET;

  const comment = await db.comment.findUnique({ where: { id } });
  if (!comment) return NextResponse.json({ error: "Comment not found." }, { status: 404 });

  if (comment.userId !== session.user.id && !isAdmin) {
    return NextResponse.json({ error: "Not authorized to delete this comment." }, { status: 403 });
  }

  await db.comment.update({ where: { id }, data: { isHidden: true } });

  return NextResponse.json({ success: true });
}
