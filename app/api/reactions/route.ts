import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { auth } from "@/auth";

const schema = z.object({
  postId: z.string().min(1),
  type:   z.enum(["LIKE", "DISLIKE"]),
});

// POST /api/reactions  — toggle like or dislike
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Login required to react to posts." }, { status: 401 });
  }

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const result = schema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: result.error.issues[0].message }, { status: 422 });
  }

  const { postId, type } = result.data;
  const userId = session.user.id;

  // Check post exists
  const post = await db.post.findUnique({ where: { id: postId }, select: { id: true } });
  if (!post) return NextResponse.json({ error: "Post not found." }, { status: 404 });

  // Find existing reaction
  const existing = await db.reaction.findUnique({
    where: { postId_userId: { postId, userId } },
  });

  if (existing) {
    if (existing.type === type) {
      // Same type → remove (toggle off)
      await db.reaction.delete({ where: { postId_userId: { postId, userId } } });
    } else {
      // Different type → switch
      await db.reaction.update({
        where: { postId_userId: { postId, userId } },
        data: { type },
      });
    }
  } else {
    // No reaction → create
    await db.reaction.create({ data: { postId, userId, type } });
  }

  // Return fresh counts + user's current reaction
  const [likes, dislikes, myReaction] = await Promise.all([
    db.reaction.count({ where: { postId, type: "LIKE" } }),
    db.reaction.count({ where: { postId, type: "DISLIKE" } }),
    db.reaction.findUnique({
      where: { postId_userId: { postId, userId } },
      select: { type: true },
    }),
  ]);

  return NextResponse.json({ likes, dislikes, myReaction: myReaction?.type ?? null });
}
