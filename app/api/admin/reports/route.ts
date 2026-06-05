import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

function isAdmin(req: NextRequest) {
  return req.headers.get("x-admin-secret") === process.env.ADMIN_SECRET;
}

const PAGE_SIZE = 20;

// GET /api/admin/reports?status=&contentType=&page=
export async function GET(req: NextRequest) {
  if (!isAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") ?? undefined;
  const contentType = searchParams.get("contentType") ?? undefined;
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const skip = (page - 1) * PAGE_SIZE;

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (contentType) where.contentType = contentType;

  const [reports, total] = await Promise.all([
    db.flagReport.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: PAGE_SIZE,
      skip,
      include: {
        user: { select: { id: true, name: true, email: true } },
        post: { select: { id: true, title: true } },
        project: { select: { id: true, title: true } },
      },
    }),
    db.flagReport.count({ where }),
  ]);

  return NextResponse.json({ reports, total, page, pages: Math.ceil(total / PAGE_SIZE) });
}

// PATCH /api/admin/reports — update flag report status
export async function PATCH(req: NextRequest) {
  if (!isAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { id, status, resolvedBy } = body as {
    id?: string;
    status?: string;
    resolvedBy?: string;
  };

  if (!id || !status) {
    return NextResponse.json({ error: "id and status are required." }, { status: 422 });
  }

  const report = await db.flagReport.update({
    where: { id },
    data: {
      status,
      resolvedBy: resolvedBy ?? null,
      resolvedAt: new Date(),
      isReviewed: true,
    },
  });

  return NextResponse.json({ report });
}
