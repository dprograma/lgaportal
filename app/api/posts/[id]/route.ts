import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { auth } from "@/auth";

const updateSchema = z.object({
  title:    z.string().min(3).max(120).optional(),
  content:  z.string().min(10).optional(),
  imageUrl: z.string().url().optional().or(z.literal("")).optional(),
  status:   z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional(),
});

// PUT /api/posts/[id]
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const { id } = await params;

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const result = updateSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: result.error.issues[0].message }, { status: 422 });
  }

  const post = await db.post.update({
    where: { id },
    data: {
      ...(result.data.title    && { title: result.data.title.trim() }),
      ...(result.data.content  && { content: result.data.content.trim() }),
      ...(result.data.status   && { status: result.data.status }),
      imageUrl: result.data.imageUrl === "" ? null : result.data.imageUrl,
    },
  });

  return NextResponse.json({ post });
}

// DELETE /api/posts/[id]
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const { id } = await params;
  await db.post.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
