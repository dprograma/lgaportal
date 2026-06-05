import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/auth";

// GET /api/reactions?contentId=&contentType=post|project
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const contentId = searchParams.get("contentId");
  const contentType = searchParams.get("contentType");

  if (!contentId || !contentType) {
    return NextResponse.json({ error: "contentId and contentType are required." }, { status: 400 });
  }

  const idField = contentType === "project" ? "projectId" : "postId";
  const reactions = await db.reaction.findMany({
    where: { [idField]: contentId },
    select: { type: true },
  });

  const counts: Record<string, number> = {};
  for (const r of reactions) {
    counts[r.type] = (counts[r.type] ?? 0) + 1;
  }

  return NextResponse.json({ counts });
}

// POST /api/reactions — auth required, upsert reaction
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Login required to react." }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { contentId, contentType, type } = body as {
    contentId?: string;
    contentType?: string;
    type?: string;
  };

  if (!contentId || !contentType || !type) {
    return NextResponse.json({ error: "contentId, contentType, and type are required." }, { status: 422 });
  }

  const validTypes = ["LIKE", "DISLIKE", "SUPPORT", "QUESTION", "REPORT"];
  if (!validTypes.includes(type)) {
    return NextResponse.json({ error: "Invalid reaction type." }, { status: 422 });
  }

  const userId = session.user.id;
  const idField = contentType === "project" ? "projectId" : "postId";

  const existing = await db.reaction.findFirst({
    where: { userId, [idField]: contentId },
  });

  if (existing) {
    if (existing.type === type) {
      await db.reaction.delete({ where: { id: existing.id } });
    } else {
      await db.reaction.update({
        where: { id: existing.id },
        data: { type: type as never },
      });
    }
  } else {
    await db.reaction.create({
      data: { userId, [idField]: contentId, type: type as never },
    });
  }

  // Return fresh counts
  const allReactions = await db.reaction.findMany({
    where: { [idField]: contentId },
    select: { type: true },
  });
  const counts: Record<string, number> = {};
  for (const r of allReactions) {
    counts[r.type] = (counts[r.type] ?? 0) + 1;
  }

  const myReaction = await db.reaction.findFirst({
    where: { userId, [idField]: contentId },
    select: { type: true },
  });

  return NextResponse.json({ counts, myReaction: myReaction?.type ?? null });
}
