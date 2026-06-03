import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lgaId    = searchParams.get("lgaId")    ?? undefined;
  const state    = searchParams.get("state")    ?? undefined;
  const category = searchParams.get("category") ?? undefined;
  const status   = searchParams.get("status")   ?? undefined;
  const archived = searchParams.get("archived"); // "true" | "false" | undefined
  const forMap   = searchParams.get("forMap") === "true"; // lighter payload
  const limit    = Math.min(Number(searchParams.get("limit")  ?? "100"), 500);
  const offset   = Number(searchParams.get("offset") ?? "0");

  const where: Record<string, unknown> = { isPublished: true };
  if (lgaId)    where.lgaId    = lgaId;
  if (category) where.category = category;
  if (status)   where.status   = status;
  if (archived === "true")  where.isArchived = true;
  else if (archived === "false") where.isArchived = false;
  if (state) {
    where.lga = { state: { equals: state, mode: "insensitive" } };
  }

  const select = forMap ? {
    id: true, lgaId: true, title: true, category: true,
    status: true, latitude: true, longitude: true, isArchived: true,
    lga: { select: { lgaName: true, state: true } },
  } : undefined;

  const [projects, total] = await Promise.all([
    db.project.findMany({ where, select, orderBy: { createdAt: "desc" }, take: limit, skip: offset }),
    db.project.count({ where }),
  ]);

  // Serialize BigInt
  const serialized = (projects as Record<string, unknown>[]).map((p) => {
    if ("budget" in p && typeof p.budget === "bigint") {
      return { ...p, budget: (p.budget as bigint).toString() };
    }
    return p;
  });

  return NextResponse.json({ projects: serialized, total });
}
