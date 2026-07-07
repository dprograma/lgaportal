import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";
import { getLgaSession } from "@/lib/lga-auth";

async function getLgaId(req: NextRequest) { return (await getLgaSession(req))?.lgaId ?? null; }

const schema = z.object({
  title:           z.string().min(3, "Title too short").max(150),
  description:     z.string().min(10).max(2000),
  category:        z.enum(["ROADS_INFRASTRUCTURE","HEALTH","EDUCATION","WATER","AGRICULTURE","OTHER"]),
  status:          z.enum(["PENDING","IN_PROGRESS","COMPLETED"]).default("PENDING"),
  latitude:        z.number().optional(),
  longitude:       z.number().optional(),
  budget:          z.number().positive().optional(),
  startDate:       z.string().optional(),
  expectedEndDate: z.string().optional(),
  images:          z.array(z.string()).optional(),
  videoUrl:        z.string().url().optional().or(z.literal("")),
  isPublished:     z.boolean().default(false),
});

export async function GET(req: NextRequest) {
  const lgaId = await getLgaId(req);
  if (!lgaId) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status   = searchParams.get("status")   ?? undefined;
  const archived = searchParams.get("archived") === "true";
  const limit    = Math.min(Number(searchParams.get("limit")  ?? "20"), 100);
  const offset   = Number(searchParams.get("offset") ?? "0");

  const where: Record<string, unknown> = { lgaId, isArchived: archived };
  if (status) where.status = status;

  const [projects, total] = await Promise.all([
    db.project.findMany({ where, orderBy: { createdAt: "desc" }, take: limit, skip: offset }),
    db.project.count({ where }),
  ]);

  return NextResponse.json({
    projects: projects.map((p) => ({ ...p, budget: p.budget?.toString() ?? null })),
    total,
  });
}

export async function POST(req: NextRequest) {
  const lgaId = await getLgaId(req);
  if (!lgaId) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  // Verify LGA is approved
  const lga = await db.lGA.findUnique({ where: { id: lgaId }, select: { status: true } });
  if (!lga || lga.status !== "APPROVED") {
    return NextResponse.json({ error: "Your LGA account must be approved to create projects." }, { status: 403 });
  }

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 422 });

  const d = parsed.data;
  const project = await db.project.create({
    data: {
      lgaId,
      title:           d.title,
      description:     d.description,
      category:        d.category,
      status:          d.status,
      latitude:        d.latitude  ?? null,
      longitude:       d.longitude ?? null,
      budget:          d.budget ? BigInt(Math.round(d.budget * 100)) : null,
      startDate:       d.startDate       ? new Date(d.startDate)       : null,
      expectedEndDate: d.expectedEndDate ? new Date(d.expectedEndDate) : null,
      images:          d.images    ?? [],
      videoUrl:        d.videoUrl  || null,
      isPublished:     d.isPublished,
    },
  });

  return NextResponse.json({ project: { ...project, budget: project.budget?.toString() ?? null } }, { status: 201 });
}
