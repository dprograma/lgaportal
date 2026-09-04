import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getLgaSession } from "@/lib/lga-auth";

// GET /api/lga/session — report whether the caller holds a valid LGA session
// (chairman or staff) based on the HttpOnly `lga_session` cookie, so client
// components (e.g. the landing navbar) can render an authenticated state. The
// cookie itself is not readable from JS, hence this endpoint.
export async function GET(req: NextRequest) {
  const session = await getLgaSession(req);
  if (!session) {
    return NextResponse.json({ authenticated: false });
  }

  const lga = await db.lGA.findUnique({
    where: { id: session.lgaId },
    select: { lgaName: true, state: true, chairmanName: true },
  });

  return NextResponse.json({
    authenticated: true,
    lgaId: session.lgaId,
    role: session.role,
    lgaName: lga?.lgaName ?? null,
    state: lga?.state ?? null,
    chairmanName: lga?.chairmanName ?? null,
  });
}
