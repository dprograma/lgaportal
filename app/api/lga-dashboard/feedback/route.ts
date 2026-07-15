import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getLgaSession } from "@/lib/lga-auth";

// GET /api/lga-dashboard/feedback?postId=xxx — citizen feedback on the chairman's
// own posts. Without postId, returns feedback across every post owned by the LGA.
export async function GET(req: NextRequest) {
  const lgaId = (await getLgaSession(req))?.lgaId ?? null;
  if (!lgaId) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const postId = searchParams.get("postId");

  if (postId) {
    const post = await db.post.findUnique({ where: { id: postId }, select: { lgaId: true } });
    if (!post || post.lgaId !== lgaId) {
      return NextResponse.json({ error: "Post not found." }, { status: 404 });
    }
  }

  const feedback = await db.feedback.findMany({
    where: { post: { lgaId }, ...(postId ? { postId } : {}) },
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      rating: true,
      category: true,
      message: true,
      createdAt: true,
      postId: true,
      post: { select: { title: true } },
      user: { select: { name: true, image: true } },
    },
  });

  return NextResponse.json({ feedback, total: feedback.length });
}
