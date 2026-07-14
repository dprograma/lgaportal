import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { auth } from "@/auth";
import { requirePublisher, getLgaSession } from "@/lib/lga-auth";

// GET /api/posts?lgaId=...&limit=10&offset=0
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lgaId  = searchParams.get("lgaId");
  const take   = Math.min(parseInt(searchParams.get("limit")  ?? "10"), 50);
  const skip   = parseInt(searchParams.get("offset") ?? "0");

  if (!lgaId) {
    return NextResponse.json({ error: "lgaId is required." }, { status: 400 });
  }

  const session = await auth();
  const userId  = session?.user?.id ?? null;

  // Public visitors only ever see published posts. The LGA's own dashboard
  // calls this same endpoint to manage its full post list (draft/published/
  // archived), so the owning LGA — verified via its session, never the
  // client-supplied lgaId — sees everything.
  const lgaSession = await getLgaSession(req);
  const isOwner = lgaSession?.lgaId === lgaId;
  const where = isOwner ? { lgaId } : { lgaId, status: "PUBLISHED" as const };

  const [posts, total] = await Promise.all([
    db.post.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take,
      skip,
      include: {
        _count: { select: { comments: { where: { isHidden: false } } } },
        reactions: userId ? { where: { userId }, select: { type: true } } : false,
      },
    }),
    db.post.count({ where }),
  ]);

  // Aggregate reaction counts per post
  const postIds = posts.map((p) => p.id);
  const rawReactions = postIds.length
    ? await db.reaction.groupBy({
        by: ["postId", "type"],
        where: { postId: { in: postIds } },
        _count: { type: true },
      })
    : [];

  const reactionMap: Record<string, { likes: number; dislikes: number }> = {};
  for (const r of rawReactions) {
    if (!r.postId) continue;
    if (!reactionMap[r.postId]) reactionMap[r.postId] = { likes: 0, dislikes: 0 };
    if (r.type === "LIKE")    reactionMap[r.postId].likes    = r._count.type;
    if (r.type === "DISLIKE") reactionMap[r.postId].dislikes = r._count.type;
  }

  const result = posts.map((p) => ({
    id:           p.id,
    lgaId:        p.lgaId,
    title:        p.title,
    content:      p.content,
    imageUrl:     p.imageUrl,
    status:       p.status,
    createdAt:    p.createdAt,
    updatedAt:    p.updatedAt,
    likes:        reactionMap[p.id]?.likes    ?? 0,
    dislikes:     reactionMap[p.id]?.dislikes ?? 0,
    commentCount: p._count.comments,
    myReaction:   userId && Array.isArray(p.reactions) && p.reactions[0]?.type ? p.reactions[0].type : null,
  }));

  return NextResponse.json({ posts: result, total });
}

// POST /api/posts  — the authenticated LGA publishes a post under its OWN lgaId.
// lgaId is taken from the verified session cookie, never from the request body,
// so an LGA can only ever publish to its own page.
const createSchema = z.object({
  title:    z.string().min(3, "Title must be at least 3 characters").max(120),
  content:  z.string().min(10, "Content must be at least 10 characters"),
  imageUrl: z.string().url().optional().or(z.literal("")),
  status:   z.enum(["DRAFT", "PUBLISHED"]).default("PUBLISHED"),
});

export async function POST(req: NextRequest) {
  const lgaSession = await requirePublisher(req);
  if (lgaSession instanceof NextResponse) return lgaSession;

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const result = createSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: result.error.issues[0].message }, { status: 422 });
  }

  const { title, content, imageUrl, status } = result.data;

  const post = await db.post.create({
    data: {
      lgaId:    lgaSession.lgaId,
      title:    title.trim(),
      content:  content.trim(),
      imageUrl: imageUrl || null,
      status,
    },
  });

  return NextResponse.json({ post }, { status: 201 });
}
