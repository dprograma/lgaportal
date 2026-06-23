import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

const ADMIN_SECRET = process.env.ADMIN_SECRET ?? "";
const auth = (req: NextRequest) => req.headers.get("x-admin-secret") === ADMIN_SECRET;

export async function GET(req: NextRequest) {
  if (!auth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const lgaId = searchParams.get("lgaId") ?? undefined;
  const year  = searchParams.get("year") ? Number(searchParams.get("year")) : undefined;
  const take  = Math.min(Number(searchParams.get("limit") ?? 25), 100);
  const skip  = Number(searchParams.get("offset") ?? 0);

  const where = {
    ...(lgaId ? { lgaId } : {}),
    ...(year  ? { financialYear: year } : {}),
  };

  const [reports, total] = await Promise.all([
    db.auditReport.findMany({
      where,
      orderBy: [{ financialYear: "desc" }, { createdAt: "desc" }],
      take,
      skip,
      include: { lga: { select: { lgaName: true, state: true } } },
    }),
    db.auditReport.count({ where }),
  ]);

  return NextResponse.json({ reports, total });
}

export async function POST(req: NextRequest) {
  if (!auth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { lgaId, financialYear, title, auditingBody, reportUrl, uploadedBy } = body as {
    lgaId: string; financialYear: number; title: string;
    auditingBody: string; reportUrl: string; uploadedBy?: string;
  };

  if (!lgaId || !financialYear || !title || !auditingBody || !reportUrl) {
    return NextResponse.json({ error: "All fields are required" }, { status: 400 });
  }

  const report = await db.auditReport.create({
    data: { lgaId, financialYear: Number(financialYear), title, auditingBody, reportUrl, uploadedBy },
  });

  return NextResponse.json({ report }, { status: 201 });
}
