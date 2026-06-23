import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const search   = searchParams.get("search")   ?? "";
  const lgaId    = searchParams.get("lgaId")    ?? undefined;
  const state    = searchParams.get("state")    ?? undefined;
  const category = searchParams.get("category") ?? undefined;
  const status   = searchParams.get("status")   ?? undefined;
  const archived = searchParams.get("archived"); // "true" | "false" | undefined
  const forMap   = searchParams.get("forMap") === "true";
  const limit    = Math.min(Number(searchParams.get("limit")  ?? "24"), 500);
  const offset   = Number(searchParams.get("offset") ?? "0");

  const where: Record<string, unknown> = {
    isPublished:    true,
    approvalStatus: "APPROVED",
  };
  if (!archived) where.isArchived = false; // default: exclude archived
  else if (archived === "true")  where.isArchived = true;
  else if (archived === "false") where.isArchived = false;

  if (lgaId)    where.lgaId    = lgaId;
  if (category) where.category = category;
  if (status)   where.status   = status;
  if (state) {
    where.lga = { state: { equals: state, mode: "insensitive" } };
  }
  if (search) {
    where.OR = [
      { title:       { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
      { lga: { lgaName: { contains: search, mode: "insensitive" } } },
    ];
  }

  const select = forMap ? {
    id: true, lgaId: true, title: true, category: true,
    status: true, latitude: true, longitude: true, isArchived: true,
    lga: { select: { lgaName: true, state: true } },
  } : {
    id: true, slug: true, title: true, description: true,
    category: true, status: true, budget: true, images: true,
    startDate: true, expectedEndDate: true, createdAt: true,
    lga: { select: { id: true, lgaName: true, state: true } },
    _count: { select: { reactions: true, comments: true } },
  };

  try {
    const [projects, total] = await Promise.all([
      db.project.findMany({ where, select, orderBy: { createdAt: "desc" }, take: limit, skip: offset }),
      db.project.count({ where }),
    ]);

    const serialized = (projects as Record<string, unknown>[]).map((p) => {
      if ("budget" in p && typeof p.budget === "bigint") {
        return { ...p, budget: (p.budget as bigint).toString() };
      }
      return p;
    });

    return NextResponse.json({ projects: serialized, total });
  } catch (error) {
    console.error("[GET /api/projects]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
