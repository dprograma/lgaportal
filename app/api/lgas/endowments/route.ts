import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requirePublisher } from "@/lib/lga-auth";

const ResourceCategories = [
  "AGRICULTURE","MINERALS","LIVESTOCK","FISHERIES","FORESTRY","ENERGY","TOURISM","MANUFACTURING",
] as const;

// lgaId is never taken from the request — it comes from the verified session.
const createSchema = z.object({
  category:       z.enum(ResourceCategories),
  title:          z.string().min(3).max(120),
  description:    z.string().min(10).max(2000),
  highlights:     z.array(z.string().min(1)).min(1).max(10),
  investmentRange: z.string().optional(),
  contactPerson:  z.string().optional(),
  contactEmail:   z.string().email().optional().or(z.literal("")),
  isPublished:    z.boolean().default(true),
});

const updateSchema = createSchema.partial().extend({ id: z.string().cuid() });

// GET  /api/lgas/endowments?lgaId=xxx   – public listing of published endowments
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lgaId = searchParams.get("lgaId");
  const category = searchParams.get("category");

  const where: Record<string, unknown> = { isPublished: true };
  if (lgaId)    where.lgaId    = lgaId;
  if (category) where.category = category;

  const endowments = await db.lGAEndowment.findMany({
    where,
    include: { lga: { select: { lgaName: true, state: true, isVerified: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ endowments });
}

// POST /api/lgas/endowments  – the authenticated LGA creates an endowment on its own page
export async function POST(req: NextRequest) {
  const session = await requirePublisher(req);
  if (session instanceof NextResponse) return session;

  try {
    const data = createSchema.parse(await req.json());

    const endowment = await db.lGAEndowment.create({
      data: {
        lgaId:          session.lgaId,
        category:       data.category,
        title:          data.title,
        description:    data.description,
        highlights:     data.highlights,
        investmentRange: data.investmentRange ?? null,
        contactPerson:  data.contactPerson ?? null,
        contactEmail:   data.contactEmail || null,
        isPublished:    data.isPublished,
      },
    });

    return NextResponse.json({ success: true, endowment }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0].message }, { status: 422 });
    }
    console.error("Endowment create error:", err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}

// PUT /api/lgas/endowments  – update one of the LGA's OWN endowments
export async function PUT(req: NextRequest) {
  const session = await requirePublisher(req);
  if (session instanceof NextResponse) return session;

  try {
    const { id, ...rest } = updateSchema.parse(await req.json());

    const existing = await db.lGAEndowment.findUnique({ where: { id }, select: { lgaId: true } });
    if (!existing || existing.lgaId !== session.lgaId) {
      return NextResponse.json({ error: "Endowment not found." }, { status: 404 });
    }

    const endowment = await db.lGAEndowment.update({ where: { id }, data: rest });
    return NextResponse.json({ success: true, endowment });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0].message }, { status: 422 });
    }
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}

// DELETE /api/lgas/endowments?id=xxx  – delete one of the LGA's OWN endowments
export async function DELETE(req: NextRequest) {
  const session = await requirePublisher(req);
  if (session instanceof NextResponse) return session;

  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id is required." }, { status: 400 });

  const existing = await db.lGAEndowment.findUnique({ where: { id }, select: { lgaId: true } });
  if (!existing || existing.lgaId !== session.lgaId) {
    return NextResponse.json({ error: "Endowment not found." }, { status: 404 });
  }

  await db.lGAEndowment.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
