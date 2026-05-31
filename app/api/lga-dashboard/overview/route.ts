import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const lgaId = req.headers.get("x-lga-id");
  if (!lgaId) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const lga = await db.lGA.findUnique({
    where: { id: lgaId },
    select: {
      id:                true,
      lgaName:           true,
      state:             true,
      chairmanName:      true,
      status:            true,
      isVerified:        true,
      tenureStatus:      true,
      tenureEndDate:     true,
      gracePeriodEndsAt: true,
      freeUntil:         true,
      _count: {
        select: {
          wards:      true,
          endowments: true,
          staff:      true,
        },
      },
    },
  });

  if (!lga) return NextResponse.json({ error: "LGA not found." }, { status: 404 });

  return NextResponse.json({ lga });
}
