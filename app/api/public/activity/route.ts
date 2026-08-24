import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

function timeAgo(date: Date): string {
  const secs = Math.floor((Date.now() - date.getTime()) / 1000);
  if (secs < 60)  return "just now";
  const mins = Math.floor(secs / 60);
  if (mins < 60)  return `${mins}m ago`;
  const hrs  = Math.floor(mins / 60);
  if (hrs  < 24)  return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export async function GET() {
  try {
    const [projects, pressReleases, topLgas, approvedLGAs] = await Promise.all([
      db.project.findMany({
        where: { isPublished: true, approvalStatus: "APPROVED" },
        select: {
          id: true,
          title: true,
          createdAt: true,
          lga: { select: { lgaName: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      db.pressRelease.findMany({
        where: { status: "PUBLISHED" },
        select: { id: true, title: true, createdAt: true },
        orderBy: { createdAt: "desc" },
        take: 4,
      }),
      db.lGA.findMany({
        where: { status: "APPROVED" },
        select: {
          lgaName: true,
          state: true,
          _count: {
            select: {
              projects: { where: { isPublished: true, approvalStatus: "APPROVED" } },
            },
          },
        },
        orderBy: { projects: { _count: "desc" } },
        take: 1,
      }),
      db.lGA.count({ where: { status: "APPROVED" } }),
    ]);

    // Build merged activity feed
    const items: { text: string; time: string; href: string; ts: number }[] = [];

    for (const p of projects) {
      items.push({
        text: `${p.title} published${p.lga ? ` in ${p.lga.lgaName} LGA` : ""}`,
        time: timeAgo(p.createdAt),
        href: `/projects/${p.id}`,
        ts: p.createdAt.getTime(),
      });
    }
    for (const pr of pressReleases) {
      const short = pr.title.length > 65 ? pr.title.slice(0, 62) + "…" : pr.title;
      items.push({ text: short, time: timeAgo(pr.createdAt), href: `/news/${pr.id}`, ts: pr.createdAt.getTime() });
    }

    items.sort((a, b) => b.ts - a.ts);
    const feed = items.slice(0, 3).map(({ text, time, href }) => ({ text, time, href }));

    return NextResponse.json(
      { feed, topLga: topLgas[0] ?? null, approvedLGAs },
      { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=30" } }
    );
  } catch {
    return NextResponse.json({ feed: [], topLga: null, approvedLGAs: 0 });
  }
}
