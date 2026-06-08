import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { auth } from "@/auth";

const CATEGORIES = [
  "Service Delivery",
  "Infrastructure",
  "Governance & Transparency",
  "Community Development",
  "Health & Education",
  "Other",
] as const;

const schema = z.object({
  postId:   z.string().min(1),
  rating:   z.number().int().min(1).max(5),
  category: z.enum(CATEGORIES),
  message:  z.string().min(10, "Feedback must be at least 10 characters.").max(1000),
});

// POST /api/feedback
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Login required to submit feedback." }, { status: 401 });
  }

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const result = schema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: result.error.issues[0].message }, { status: 422 });
  }

  const { postId, rating, category, message } = result.data;
  const userId = session.user.id;

  // Verify post exists
  const post = await db.post.findUnique({
    where: { id: postId, status: "PUBLISHED" },
    select: { id: true },
  });
  if (!post) return NextResponse.json({ error: "Post not found." }, { status: 404 });

  // One feedback per user per post
  const existing = await db.feedback.findFirst({
    where: { postId, userId },
  });
  if (existing) {
    return NextResponse.json(
      { error: "You have already submitted feedback for this post." },
      { status: 409 }
    );
  }

  await db.feedback.create({
    data: { postId, userId, rating, category, message: message.trim() },
  });

  return NextResponse.json({ success: true }, { status: 201 });
}
