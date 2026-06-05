import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/auth";

function isAdmin(req: NextRequest) {
  return req.headers.get("x-admin-secret") === process.env.ADMIN_SECRET;
}

// GET /api/admin/moderation — flagged content queue + recently hidden
export async function GET(req: NextRequest) {
  if (!isAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const [pendingReports, recentActions, hiddenPosts, hiddenProjects] = await Promise.all([
    db.flagReport.findMany({
      where: { status: "PENDING" },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        user: { select: { id: true, name: true, email: true } },
        post: { select: { id: true, title: true, status: true } },
        project: { select: { id: true, title: true, isPublished: true } },
      },
    }),
    db.moderationAction.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        admin: { select: { id: true, name: true, email: true } },
      },
    }),
    db.post.findMany({
      where: { status: "ARCHIVED" },
      orderBy: { updatedAt: "desc" },
      take: 20,
      select: { id: true, title: true, status: true, updatedAt: true, lgaId: true },
    }),
    db.project.findMany({
      where: { isPublished: false },
      orderBy: { updatedAt: "desc" },
      take: 20,
      select: { id: true, title: true, isPublished: true, reportCount: true, updatedAt: true },
    }),
  ]);

  return NextResponse.json({ pendingReports, recentActions, hiddenPosts, hiddenProjects });
}

// POST /api/admin/moderation — take moderation action
export async function POST(req: NextRequest) {
  if (!isAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const session = await auth();
  const adminId = session?.user?.id;
  if (!adminId) {
    return NextResponse.json({ error: "Session required." }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { action, targetType, targetId, reason, duration } = body as {
    action?: string;
    targetType?: string;
    targetId?: string;
    reason?: string;
    duration?: number;
  };

  if (!action || !targetType || !targetId || !reason) {
    return NextResponse.json({ error: "action, targetType, targetId, and reason are required." }, { status: 422 });
  }

  const validActions = ["DELETE", "WARN", "SUSPEND", "BAN", "HIDE"];
  if (!validActions.includes(action)) {
    return NextResponse.json({ error: "Invalid action." }, { status: 422 });
  }

  // Execute action
  if (action === "DELETE") {
    if (targetType === "post") {
      await db.post.delete({ where: { id: targetId } }).catch(() => null);
    } else if (targetType === "project") {
      await db.project.delete({ where: { id: targetId } }).catch(() => null);
    } else if (targetType === "comment") {
      await db.comment.update({ where: { id: targetId }, data: { isHidden: true } }).catch(() => null);
    }
  } else if (action === "HIDE") {
    if (targetType === "post") {
      await db.post.update({ where: { id: targetId }, data: { status: "ARCHIVED" } }).catch(() => null);
    } else if (targetType === "project") {
      await db.project.update({ where: { id: targetId }, data: { isPublished: false } }).catch(() => null);
    }
  } else if (action === "SUSPEND") {
    const days = typeof duration === "number" && duration > 0 ? duration : 7;
    await db.user.update({
      where: { id: targetId },
      data: { suspendedUntil: new Date(Date.now() + days * 86400000) },
    }).catch(() => null);
  } else if (action === "BAN") {
    await db.user.update({
      where: { id: targetId },
      data: { isBanned: true, banReason: reason },
    }).catch(() => null);
  }
  // WARN: no content change, just log

  // Always create a ModerationAction record
  await db.moderationAction.create({
    data: {
      adminId,
      targetType,
      targetId,
      action,
      reason,
      duration: typeof duration === "number" ? duration : null,
    },
  });

  return NextResponse.json({ ok: true });
}
