import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/auth";

// POST /api/lga-dashboard/projects/[id]/approve — LGA chairman only
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  // Allow LGA_CHAIRMAN role
  if (session.user.role !== "LGA_CHAIRMAN") {
    return NextResponse.json({ error: "Only LGA chairmen can approve projects." }, { status: 403 });
  }

  const { id } = await params;

  const project = await db.project.findUnique({
    where: { id },
    select: { id: true, approvalStatus: true, status: true },
  });

  if (!project) {
    return NextResponse.json({ error: "Project not found." }, { status: 404 });
  }

  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    // no body is fine
  }

  const note = (body.note as string) ?? null;

  await db.$transaction([
    db.project.update({
      where: { id },
      data: { approvalStatus: "APPROVED", isPublished: true },
    }),
    db.projectStatusLog.create({
      data: {
        projectId: id,
        oldStatus: project.approvalStatus,
        newStatus: "APPROVED",
        changedBy: session.user.id,
        note,
      },
    }),
  ]);

  return NextResponse.json({ ok: true });
}
