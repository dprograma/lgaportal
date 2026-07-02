import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const feedbacks = await db.feedback.findMany({
      where: { rating: { gte: 4 } },
      select: {
        id: true,
        message: true,
        rating: true,
        category: true,
        createdAt: true,
        user: { select: { name: true, lga: true, state: true } },
      },
      orderBy: [{ rating: "desc" }, { createdAt: "desc" }],
      take: 6,
    });

    return NextResponse.json({ testimonials: feedbacks }, {
      headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60" },
    });
  } catch {
    return NextResponse.json({ error: "Failed to load testimonials." }, { status: 500 });
  }
}
