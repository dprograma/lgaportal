import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/auth";

const VALID_REASONS = ["MISLEADING", "INAPPROPRIATE", "MISINFORMATION", "SPAM", "OFFENSIVE", "OTHER"];

// POST /api/reports — auth required
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Login required to report content." }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { contentId, contentType, reason, details } = body as {
    contentId?: string;
    contentType?: string;
    reason?: string;
    details?: string;
  };

  if (!contentId || !contentType || !reason) {
    return NextResponse.json({ error: "contentId, contentType, and reason are required." }, { status: 422 });
  }

  if (!["post", "project", "comment"].includes(contentType)) {
    return NextResponse.json({ error: "contentType must be post, project, or comment." }, { status: 422 });
  }

  if (!VALID_REASONS.includes(reason)) {
    return NextResponse.json({ error: "Invalid reason." }, { status: 422 });
  }

  const idField =
    contentType === "project" ? "projectId"
    : contentType === "comment" ? "commentId"
    : "postId";

  // Create the flag report
  await db.flagReport.create({
    data: {
      ...(contentType === "project"
        ? { projectId: contentId }
        : contentType === "comment"
        ? { commentId: contentId }
        : { postId: contentId }),
      contentType,
      userId: session.user.id,
      reason: reason as never,
      details: details ?? null,
    },
  });

  // If project, increment reportCount and auto-unpublish at 5 reports
  if (contentType === "project") {
    const project = await db.project.update({
      where: { id: contentId },
      data: { reportCount: { increment: 1 } },
      select: { reportCount: true, isPublished: true },
    });

    if (project.reportCount >= 5 && project.isPublished) {
      await db.project.update({
        where: { id: contentId },
        data: { isPublished: false },
      });
    }
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
