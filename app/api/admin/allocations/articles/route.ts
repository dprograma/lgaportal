import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";
import { isAdminRequest } from "@/lib/admin-auth";


function toSlug(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") + "-" + Date.now();
}

const articleSchema = z.object({
  title:       z.string().min(3),
  content:     z.string().min(10),
  month:       z.number().int().min(1).max(12).optional(),
  year:        z.number().int().min(2020).max(2100).optional(),
  coverImage:  z.string().optional(),
  attachments: z.array(z.string()).optional(),
  status:      z.enum(["DRAFT", "PUBLISHED", "SCHEDULED"]).optional(),
  scheduledAt: z.string().optional(),
});

export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") ?? undefined;
  const limit  = Math.min(Number(searchParams.get("limit") ?? "20"), 100);
  const offset = Number(searchParams.get("offset") ?? "0");

  const where = status ? { status } : {};
  const [articles, total] = await Promise.all([
    db.allocationArticle.findMany({ where, orderBy: { createdAt: "desc" }, take: limit, skip: offset }),
    db.allocationArticle.count({ where }),
  ]);

  return NextResponse.json({ articles, total });
}

export async function POST(req: NextRequest) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }
  const parsed = articleSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 422 });

  const d = parsed.data;
  const article = await db.allocationArticle.create({
    data: {
      title:       d.title,
      slug:        toSlug(d.title),
      content:     d.content,
      month:       d.month ?? null,
      year:        d.year  ?? null,
      coverImage:  d.coverImage  ?? null,
      attachments: d.attachments ?? [],
      status:      d.status      ?? "DRAFT",
      scheduledAt: d.scheduledAt ? new Date(d.scheduledAt) : null,
      publishedAt: d.status === "PUBLISHED" ? new Date() : null,
    },
  });

  return NextResponse.json({ article }, { status: 201 });
}

