import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getStateCoords, lgaCoords } from "@/lib/nigeria-coordinates";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") ?? "lgas"; // "lgas" | "projects"

  if (type === "projects") {
    const projects = await db.project.findMany({
      where: { isPublished: true },
      select: {
        id: true, title: true, category: true, status: true,
        latitude: true, longitude: true, isArchived: true,
        lga: { select: { lgaName: true, state: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    // Only return projects with coordinates
    const withCoords = projects.filter((p) => p.latitude && p.longitude);
    return NextResponse.json({ projects: withCoords });
  }

  // type === "lgas"
  const lgas = await db.lGA.findMany({
    where: { status: "APPROVED" },
    select: {
      id: true, lgaName: true, state: true, chairmanName: true, isVerified: true,
      _count: { select: { posts: true, wards: true } },
    },
    orderBy: [{ state: "asc" }, { lgaName: "asc" }],
  });

  // Group by state to compute offsets
  const byState: Record<string, typeof lgas> = {};
  for (const lga of lgas) {
    if (!byState[lga.state]) byState[lga.state] = [];
    byState[lga.state].push(lga);
  }

  const markers = lgas.map((lga) => {
    const stateGroup = byState[lga.state];
    const idx = stateGroup.findIndex((l) => l.id === lga.id);
    const [lat, lng] = lgaCoords(lga.state, idx, stateGroup.length);
    return { ...lga, lat, lng };
  });

  // Also fetch latest allocation per state for popup
  const latestAllocations = await db.allocationRecord.findMany({
    where: { isPublished: true },
    orderBy: [{ year: "desc" }, { month: "desc" }],
    distinct: ["state", "lgaName"],
    take: 774,
  });
  const allocationMap: Record<string, string> = {};
  for (const a of latestAllocations) {
    const key = `${a.lgaName}|${a.state}`;
    if (!allocationMap[key]) {
      allocationMap[key] = a.amount.toString();
    }
  }

  const markersWithAlloc = markers.map((m) => ({
    ...m,
    latestAllocation: allocationMap[`${m.lgaName}|${m.state}`] ?? null,
  }));

  return NextResponse.json({ lgas: markersWithAlloc });
}
