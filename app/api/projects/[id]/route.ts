import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

function isAdmin(req: NextRequest) {
  return req.headers.get("x-admin-secret") === process.env.ADMIN_SECRET;
}

// GET /api/projects/[id] — public project detail
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const admin = isAdmin(req);

  // Try id first, then slug
  let project = await db.project.findFirst({
    where: {
      id,
      ...(admin ? {} : { isPublished: true, approvalStatus: "APPROVED" }),
    },
    include: {
      lga: { select: { id: true, lgaName: true, state: true } },
      reactions: { select: { type: true } },
      comments: {
        where: { isHidden: false, parentId: null },
        select: { id: true },
      },
      statusLogs: { orderBy: { createdAt: "desc" }, take: 5 },
    },
  });

  if (!project) {
    // Try by slug
    project = await db.project.findFirst({
      where: {
        slug: id,
        ...(admin ? {} : { isPublished: true, approvalStatus: "APPROVED" }),
      },
      include: {
        lga: { select: { id: true, lgaName: true, state: true } },
        reactions: { select: { type: true } },
        comments: {
          where: { isHidden: false, parentId: null },
          select: { id: true },
        },
        statusLogs: { orderBy: { createdAt: "desc" }, take: 5 },
      },
    });
  }

  if (!project) {
    return NextResponse.json({ error: "Project not found." }, { status: 404 });
  }

  // Build reaction counts
  const reactionCounts: Record<string, number> = {};
  for (const r of project.reactions) {
    reactionCounts[r.type] = (reactionCounts[r.type] ?? 0) + 1;
  }

  const { reactions, comments, budget, ...rest } = project;

  return NextResponse.json({
    project: {
      ...rest,
      budget: budget?.toString() ?? null,
      reactionCounts,
      commentCount: comments.length,
    },
  });
}
