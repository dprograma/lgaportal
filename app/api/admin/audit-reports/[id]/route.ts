import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAdminRequest } from "@/lib/admin-auth";


export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await req.json().catch(() => ({}));

  const report = await db.auditReport.update({
    where: { id },
    data: {
      ...(body.title         ? { title: body.title }               : {}),
      ...(body.auditingBody  ? { auditingBody: body.auditingBody } : {}),
      ...(body.reportUrl     ? { reportUrl: body.reportUrl }       : {}),
      ...(body.financialYear ? { financialYear: Number(body.financialYear) } : {}),
      ...(body.isPublished !== undefined ? { isPublished: body.isPublished } : {}),
    },
  });

  return NextResponse.json({ report });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  await db.auditReport.delete({ where: { id } });
  return NextResponse.json({ message: "Audit report deleted." });
}
