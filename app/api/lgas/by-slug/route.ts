import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

function slugToName(s: string) {
  // reverse the slug — used for partial matching
  return s.replace(/-/g, " ");
}

export async function GET(req: NextRequest) {
  const slug = new URL(req.url).searchParams.get("slug");
  if (!slug) return NextResponse.json({ error: "slug is required." }, { status: 400 });

  // Try exact match first (slug was generated as lgaName lowercased + hyphenated)
  const lga = await db.lGA.findFirst({
    where: {
      lgaName: { equals: slugToName(slug), mode: "insensitive" },
      status:  "APPROVED",
    },
    include: {
      wards:      { orderBy: [{ wardNumber: "asc" }, { wardName: "asc" }] },
      endowments: { where: { isPublished: true }, orderBy: { createdAt: "desc" } },
    },
  });

  if (!lga) return NextResponse.json({ error: "LGA not found." }, { status: 404 });

  return NextResponse.json({ lga });
}
