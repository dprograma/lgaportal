import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requirePublisher } from "@/lib/lga-auth";

// GET /api/posts/[id] — public: look up by id or slug
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  let post = await db.post.findFirst({
    where: { id, status: "PUBLISHED" },
    include: {
      lga: { select: { id: true, lgaName: true, state: true } },
      reactions: { select: { type: true } },
      comments: { where: { isHidden: false, parentId: null }, select: { id: true } },
    },
  });

  if (!post) {
    post = await db.post.findFirst({
      where: { status: "PUBLISHED" },
      include: {
        lga: { select: { id: true, lgaName: true, state: true } },
        reactions: { select: { type: true } },
        comments: { where: { isHidden: false, parentId: null }, select: { id: true } },
      },
    });
  }

  if (!post) return NextResponse.json({ error: "Post not found." }, { status: 404 });

  const reactionCounts: Record<string, number> = {};
  for (const r of post.reactions) {
    reactionCounts[r.type] = (reactionCounts[r.type] ?? 0) + 1;
  }

  const { reactions, comments, ...rest } = post;
  return NextResponse.json({ post: { ...rest, reactionCounts, commentCount: comments.length } });
}

const updateSchema = z.object({
  title:    z.string().min(3).max(120).optional(),
  content:  z.string().min(10).optional(),
  imageUrl: z.string().url().optional().or(z.literal("")).optional(),
  status:   z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional(),
});

// PUT /api/posts/[id]
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const lgaSession = await requirePublisher(req);
  if (lgaSession instanceof NextResponse) return lgaSession;

  const { id } = await params;

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const result = updateSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: result.error.issues[0].message }, { status: 422 });
  }

  // Only the owning LGA may edit its post.
  const existing = await db.post.findUnique({ where: { id }, select: { lgaId: true } });
  if (!existing || existing.lgaId !== lgaSession.lgaId) {
    return NextResponse.json({ error: "Post not found." }, { status: 404 });
  }

  const post = await db.post.update({
    where: { id },
    data: {
      ...(result.data.title    && { title: result.data.title.trim() }),
      ...(result.data.content  && { content: result.data.content.trim() }),
      ...(result.data.status   && { status: result.data.status }),
      imageUrl: result.data.imageUrl === "" ? null : result.data.imageUrl,
    },
  });

  return NextResponse.json({ post });
}

// DELETE /api/posts/[id]
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const lgaSession = await requirePublisher(req);
  if (lgaSession instanceof NextResponse) return lgaSession;

  const { id } = await params;

  // Only the owning LGA may delete its post.
  const existing = await db.post.findUnique({ where: { id }, select: { lgaId: true } });
  if (!existing || existing.lgaId !== lgaSession.lgaId) {
    return NextResponse.json({ error: "Post not found." }, { status: 404 });
  }

  await db.post.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
