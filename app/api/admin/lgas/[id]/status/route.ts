import { NextRequest, NextResponse } from "next/server";
import { db as prisma } from "@/lib/db";
import { LGAStatus } from "@prisma/client";
import { isAdminRequest } from "@/lib/admin-auth";


export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const { status, reason } = body as { status: string; reason?: string };

  const allowed = ["APPROVED", "SUSPENDED", "DEACTIVATED", "REJECTED"];
  if (!allowed.includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const lga = await prisma.lGA.findUnique({ where: { id }, select: { id: true, lgaName: true } });
  if (!lga) return NextResponse.json({ error: "LGA not found" }, { status: 404 });

  await prisma.lGA.update({
    where: { id },
    data: { status: status as LGAStatus },
  });

  return NextResponse.json({ message: `${lga.lgaName} status updated to ${status}.`, reason });
}
