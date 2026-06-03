import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

function getLgaId(req: NextRequest) { return req.headers.get("x-lga-id"); }

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const lgaId = getLgaId(req);
  if (!lgaId) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const { id } = await params;

  const project = await db.project.findFirst({
    where: { id, lgaId },
    include: { statusLogs: { orderBy: { createdAt: "desc" }, take: 10 } },
  });
  if (!project) return NextResponse.json({ error: "Not found." }, { status: 404 });

  return NextResponse.json({ project: { ...project, budget: project.budget?.toString() ?? null } });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const lgaId = getLgaId(req);
  if (!lgaId) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const { id } = await params;

  const existing = await db.project.findFirst({ where: { id, lgaId } });
  if (!existing) return NextResponse.json({ error: "Not found." }, { status: 404 });
  if (existing.isArchived) return NextResponse.json({ error: "Archived projects cannot be edited." }, { status: 403 });

  let body: Record<string, unknown> = {};
  try { body = await req.json(); } catch { /* ok */ }

  const data: Record<string, unknown> = { updatedAt: new Date() };

  if (body.title)           data.title           = body.title;
  if (body.description)     data.description     = body.description;
  if (body.category)        data.category        = body.category;
  if (body.latitude  !== undefined) data.latitude  = body.latitude;
  if (body.longitude !== undefined) data.longitude = body.longitude;
  if (body.budget !== undefined)    data.budget    = body.budget ? BigInt(Math.round((body.budget as number) * 100)) : null;
  if (body.startDate)       data.startDate       = new Date(body.startDate as string);
  if (body.expectedEndDate) data.expectedEndDate = new Date(body.expectedEndDate as string);
  if (body.images)          data.images          = body.images;
  if (body.videoUrl !== undefined) data.videoUrl = body.videoUrl || null;
  if (body.isPublished !== undefined) data.isPublished = body.isPublished;
  if (body.isArchived !== undefined) data.isArchived  = body.isArchived;

  // Status change — create audit log
  if (body.status && body.status !== existing.status) {
    data.status = body.status;
    await db.projectStatusLog.create({
      data: {
        projectId: id,
        oldStatus: existing.status,
        newStatus: body.status as string,
        changedBy: lgaId,
        note: (body.statusNote as string) ?? null,
      },
    });
  }

  const project = await db.project.update({ where: { id }, data });
  return NextResponse.json({ project: { ...project, budget: project.budget?.toString() ?? null } });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const lgaId = getLgaId(req);
  if (!lgaId) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const { id } = await params;

  const existing = await db.project.findFirst({ where: { id, lgaId } });
  if (!existing) return NextResponse.json({ error: "Not found." }, { status: 404 });
  if (existing.isArchived) return NextResponse.json({ error: "Archived projects cannot be deleted." }, { status: 403 });

  await db.project.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
