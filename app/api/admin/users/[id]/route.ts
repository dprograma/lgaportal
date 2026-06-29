import { NextRequest, NextResponse } from "next/server";
import { db as prisma } from "@/lib/db";
import { $Enums } from "@prisma/client";
import { isAdminRequest } from "@/lib/admin-auth";



export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const { action, reason, durationHours } = body as {
    action: string;
    reason?: string;
    durationHours?: number;
  };

  const user = await prisma.user.findUnique({ where: { id }, select: { id: true, role: true } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
  if (user.role === $Enums.UserRole.ADMIN) return NextResponse.json({ error: "Cannot modify admin accounts" }, { status: 403 });

  if (action === "ban") {
    await prisma.user.update({
      where: { id },
      data: { isBanned: true, isActive: false, banReason: reason ?? "Banned by admin" },
    });
    return NextResponse.json({ message: "User banned." });
  }

  if (action === "unban") {
    await prisma.user.update({
      where: { id },
      data: { isBanned: false, isActive: true, banReason: null },
    });
    return NextResponse.json({ message: "User unbanned." });
  }

  if (action === "suspend") {
    const hours = Number(durationHours ?? 24);
    const suspendedUntil = new Date(Date.now() + hours * 60 * 60 * 1000);
    await prisma.user.update({ where: { id }, data: { suspendedUntil } });
    return NextResponse.json({ message: `User suspended for ${hours} hours.` });
  }

  if (action === "activate") {
    await prisma.user.update({
      where: { id },
      data: { isActive: true, isBanned: false, banReason: null, suspendedUntil: null },
    });
    return NextResponse.json({ message: "User activated." });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
