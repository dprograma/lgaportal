import { NextRequest } from "next/server";
import { db } from "@/lib/db";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    await db.adCampaign.update({
      where: { id },
      data: { clicks: { increment: 1 } },
    });
    return Response.json({ success: true });
  } catch (e) {
    console.error("Click track error:", e);
    return Response.json({ success: false }, { status: 500 });
  }
}
