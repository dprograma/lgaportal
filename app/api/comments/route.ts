import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { auth } from "@/auth";

// GET /api/comments?postId=...&limit=20&offset=0
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const postId = searchParams.get("postId");
  const take   = Math.min(parseInt(searchParams.get("limit")  ?? "20"), 50);
  const skip   = parseInt(searchParams.get("offset") ?? "0");

  if (!postId) {
    return NextResponse.json({ error: "postId is required." }, { status: 400 });
  }

  const [comments, total] = await Promise.all([
    db.comment.findMany({
      where: { postId, isHidden: false },
      orderBy: { createdAt: "asc" },
      take,
      skip,
      select: {
        id:        true,
        content:   true,
        createdAt: true,
        user: { select: { id: true, name: true, image: true } },
      },
    }),
    db.comment.count({ where: { postId, isHidden: false } }),
  ]);

  return NextResponse.json({ comments, total });
}

// POST /api/comments
const schema = z.object({
  postId:  z.string().min(1),
  content: z.string()
    .min(1, "Comment cannot be empty.")
    .max(500, "Comment must not exceed 500 characters."),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Login required to comment." }, { status: 401 });
  }

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const result = schema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: result.error.issues[0].message }, { status: 422 });
  }

  const { postId, content } = result.data;

  // Verify post exists and is published
  const post = await db.post.findUnique({
    where: { id: postId, status: "PUBLISHED" },
    select: { id: true },
  });
  if (!post) return NextResponse.json({ error: "Post not found." }, { status: 404 });

  const comment = await db.comment.create({
    data: { postId, userId: session.user.id, content: content.trim() },
    select: {
      id:        true,
      content:   true,
      createdAt: true,
      user: { select: { id: true, name: true, image: true } },
    },
  });

  return NextResponse.json({ comment }, { status: 201 });
}
