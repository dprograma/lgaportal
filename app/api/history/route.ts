import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/history?q=...&lgaName=...&chairmanName=...&yearFrom=...&yearTo=...&type=post|project|allocation
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const q            = (searchParams.get("q") ?? "").trim();
  const lgaName      = searchParams.get("lgaName") ?? "";
  const chairmanName = searchParams.get("chairmanName") ?? "";
  const yearFrom     = searchParams.get("yearFrom") ? Number(searchParams.get("yearFrom")) : undefined;
  const yearTo       = searchParams.get("yearTo")   ? Number(searchParams.get("yearTo"))   : undefined;
  const type         = searchParams.get("type") ?? "all"; // post | project | allocation | all
  const take         = 20;

  if (!q && !lgaName && !chairmanName && !yearFrom) {
    return NextResponse.json({ posts: [], projects: [], allocations: [], total: 0 });
  }

  const dateFrom = yearFrom ? new Date(`${yearFrom}-01-01`) : undefined;
  const dateTo   = yearTo   ? new Date(`${yearTo}-12-31`)   : undefined;

  const [posts, projects, allocations] = await Promise.all([
    // Posts
    (type === "all" || type === "post") ? db.post.findMany({
      where: {
        status: "ARCHIVED",
        ...(q            ? { OR: [{ title: { contains: q, mode: "insensitive" } }, { content: { contains: q, mode: "insensitive" } }] } : {}),
        ...(lgaName      ? { lga: { lgaName: { contains: lgaName, mode: "insensitive" } } } : {}),
        ...(chairmanName ? { tenure: { chairmanName: { contains: chairmanName, mode: "insensitive" } } } : {}),
        ...(dateFrom ? { createdAt: { gte: dateFrom } } : {}),
        ...(dateTo   ? { createdAt: { lte: dateTo   } } : {}),
      },
      take,
      orderBy: { createdAt: "desc" },
      select: {
        id: true, title: true, createdAt: true, publishedAt: true,
        lga: { select: { id: true, lgaName: true, state: true } },
        tenure: { select: { chairmanName: true, startDate: true, endDate: true } },
      },
    }) : Promise.resolve([]),

    // Projects
    (type === "all" || type === "project") ? db.project.findMany({
      where: {
        isArchived: true,
        ...(q       ? { OR: [{ title: { contains: q, mode: "insensitive" } }, { description: { contains: q, mode: "insensitive" } }] } : {}),
        ...(lgaName ? { lga: { lgaName: { contains: lgaName, mode: "insensitive" } } } : {}),
        ...(dateFrom ? { createdAt: { gte: dateFrom } } : {}),
        ...(dateTo   ? { createdAt: { lte: dateTo   } } : {}),
      },
      take,
      orderBy: { createdAt: "desc" },
      select: {
        id: true, title: true, category: true, status: true, createdAt: true,
        lga: { select: { id: true, lgaName: true, state: true } },
      },
    }) : Promise.resolve([]),

    // Allocation records
    (type === "all" || type === "allocation") ? db.allocationRecord.findMany({
      where: {
        isPublished: true,
        ...(q       ? { lgaName: { contains: q, mode: "insensitive" } } : {}),
        ...(lgaName ? { lgaName: { contains: lgaName, mode: "insensitive" } } : {}),
        ...(yearFrom ? { year: { gte: yearFrom } } : {}),
        ...(yearTo   ? { year: { lte: yearTo   } } : {}),
      },
      take,
      orderBy: [{ year: "desc" }, { month: "desc" }],
      select: {
        id: true, lgaName: true, state: true,
        month: true, year: true, amount: true, source: true, publishedAt: true,
      },
    }) : Promise.resolve([]),
  ]);

  return NextResponse.json({
    posts,
    projects,
    allocations: allocations.map((a) => ({ ...a, amount: a.amount.toString() })),
    total: posts.length + projects.length + allocations.length,
  });
}
