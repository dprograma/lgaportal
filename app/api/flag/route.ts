import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { auth } from "@/auth";

const schema = z.object({
  postId:  z.string().min(1),
  reason:  z.enum(["INAPPROPRIATE", "MISINFORMATION", "SPAM", "OFFENSIVE", "OTHER"]),
  details: z.string().max(500).optional(),
});

// POST /api/flag
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Login required to report content." }, { status: 401 });
  }

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const result = schema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: result.error.issues[0].message }, { status: 422 });
  }

  const { postId, reason, details } = result.data;
  const userId = session.user.id;

  // Verify post exists
  const post = await db.post.findUnique({
    where: { id: postId, status: "PUBLISHED" },
    select: { id: true },
  });
  if (!post) return NextResponse.json({ error: "Post not found." }, { status: 404 });

  // One flag per user per post
  const existing = await db.flagReport.findUnique({
    where: { postId_userId: { postId, userId } },
  });
  if (existing) {
    return NextResponse.json(
      { error: "You have already reported this post." },
      { status: 409 }
    );
  }

  await db.flagReport.create({
    data: { postId, userId, reason, details: details?.trim() ?? null },
  });

  return NextResponse.json({ success: true }, { status: 201 });
}
