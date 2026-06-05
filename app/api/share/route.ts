import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// POST /api/share — no auth required
export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { contentId, contentType } = body as {
    contentId?: string;
    contentType?: string;
  };

  if (!contentId || !contentType) {
    return NextResponse.json({ error: "contentId and contentType are required." }, { status: 422 });
  }

  if (contentType === "project") {
    await db.project.update({
      where: { id: contentId },
      data: { shareCount: { increment: 1 } },
    }).catch(() => null); // Ignore if project not found
  }

  return NextResponse.json({ ok: true });
}
