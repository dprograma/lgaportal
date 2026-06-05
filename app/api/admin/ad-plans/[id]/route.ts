import { NextRequest } from "next/server";
import { db } from "@/lib/db";

function isAdmin(req: NextRequest) {
  return req.headers.get("x-admin-secret") === process.env.ADMIN_SECRET;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAdmin(req)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const updateData: Record<string, unknown> = {};
  if (body.name !== undefined) updateData.name = body.name;
  if (body.description !== undefined) updateData.description = body.description;
  if (body.price !== undefined) updateData.price = BigInt(body.price as number);
  if (body.durationDays !== undefined) updateData.durationDays = body.durationDays;
  if (body.formats !== undefined) updateData.formats = body.formats;
  if (body.placements !== undefined) updateData.placements = body.placements;
  if (body.maxImpressions !== undefined) updateData.maxImpressions = body.maxImpressions;
  if (body.sortOrder !== undefined) updateData.sortOrder = body.sortOrder;
  if (body.isActive !== undefined) updateData.isActive = body.isActive;

  try {
    const plan = await db.adPlan.update({
      where: { id },
      data: updateData,
    });
    return Response.json({ plan: { ...plan, price: plan.price.toString() } });
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Failed to update plan" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAdmin(req)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  try {
    await db.adPlan.update({
      where: { id },
      data: { isActive: false },
    });
    return Response.json({ success: true });
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Failed to deactivate plan" }, { status: 500 });
  }
}
