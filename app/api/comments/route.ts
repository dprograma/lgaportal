import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/auth";

const PAGE_SIZE = 10;

// GET /api/comments?contentId=&contentType=&page=
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const contentId = searchParams.get("contentId");
  const contentType = searchParams.get("contentType");
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const skip = (page - 1) * PAGE_SIZE;

  if (!contentId || !contentType) {
    return NextResponse.json({ error: "contentId and contentType are required." }, { status: 400 });
  }

  const idField = contentType === "project" ? "projectId" : "postId";

  // Top-level comments only (no parentId), not hidden, not rejected
  const where = {
    [idField]: contentId,
    parentId: null,
    isHidden: false,
    modStatus: { not: "REJECTED" },
  };

  const [comments, total] = await Promise.all([
    db.comment.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: PAGE_SIZE,
      skip,
      select: {
        id: true,
        content: true,
        createdAt: true,
        editedAt: true,
        userId: true,
        user: { select: { id: true, name: true, image: true } },
        replies: {
          where: { isHidden: false, modStatus: { not: "REJECTED" } },
          orderBy: { createdAt: "asc" },
          select: {
            id: true,
            content: true,
            createdAt: true,
            editedAt: true,
            userId: true,
            user: { select: { id: true, name: true, image: true } },
          },
        },
      },
    }),
    db.comment.count({ where }),
  ]);

  return NextResponse.json({ comments, total, page, pages: Math.ceil(total / PAGE_SIZE) });
}

// POST /api/comments — auth required
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Login required to comment." }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { contentId, contentType, content, parentId } = body as {
    contentId?: string;
    contentType?: string;
    content?: string;
    parentId?: string;
  };

  if (!contentId || !contentType || !content) {
    return NextResponse.json({ error: "contentId, contentType, and content are required." }, { status: 422 });
  }

  if (content.length > 500) {
    return NextResponse.json({ error: "Comment must not exceed 500 characters." }, { status: 422 });
  }

  if (content.trim().length === 0) {
    return NextResponse.json({ error: "Comment cannot be empty." }, { status: 422 });
  }

  const idField = contentType === "project" ? "projectId" : "postId";

  // Moderation via OpenAI
  let modStatus = "APPROVED";
  const apiKey = process.env.OPENAI_API_KEY;
  if (apiKey) {
    try {
      const modRes = await fetch("https://api.openai.com/v1/moderations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({ input: content }),
      });
      if (modRes.ok) {
        const modData = await modRes.json() as { results: Array<{ flagged: boolean }> };
        if (modData.results?.[0]?.flagged) {
          modStatus = "HELD";
        }
      }
    } catch {
      // Skip moderation on error
    }
  }

  const comment = await db.comment.create({
    data: {
      [idField]: contentId,
      userId: session.user.id,
      content: content.trim(),
      parentId: parentId ?? null,
      modStatus,
    },
    select: {
      id: true,
      content: true,
      createdAt: true,
      editedAt: true,
      userId: true,
      modStatus: true,
      user: { select: { id: true, name: true, image: true } },
    },
  });

  const status = modStatus === "HELD" ? 202 : 201;
  return NextResponse.json({ comment, held: modStatus === "HELD" }, { status });
}
