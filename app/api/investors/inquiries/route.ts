import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { sendInquiryNotificationToLGA } from "@/lib/email";

const schema = z.object({
  investorId:  z.string().cuid(),
  lgaId:       z.string().cuid(),
  endowmentId: z.string().cuid().optional(),
  message:     z.string().min(10).max(2000),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = schema.parse(body);

    // Validate investor + LGA exist
    const [investor, lga] = await Promise.all([
      db.investor.findUnique({ where: { id: data.investorId } }),
      db.lGA.findUnique({ where: { id: data.lgaId } }),
    ]);

    if (!investor) return NextResponse.json({ error: "Investor not found." }, { status: 404 });
    if (!lga)      return NextResponse.json({ error: "LGA not found." },      { status: 404 });

    const inquiry = await db.investorInquiry.create({
      data: {
        investorId:  data.investorId,
        lgaId:       data.lgaId,
        endowmentId: data.endowmentId ?? null,
        message:     data.message,
      },
    });

    // Notify LGA chairman by email
    try {
      await sendInquiryNotificationToLGA({
        lgaEmail:     lga.email,
        lgaName:      lga.lgaName,
        investorName: investor.fullName,
        investorEmail: investor.email,
        company:      investor.company ?? undefined,
        message:      data.message,
      });
    } catch (_) {}

    return NextResponse.json({ success: true, inquiryId: inquiry.id }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors[0].message }, { status: 422 });
    }
    console.error("Inquiry submit error:", err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lgaId = searchParams.get("lgaId");
  if (!lgaId) return NextResponse.json({ error: "lgaId is required." }, { status: 400 });

  const inquiries = await db.investorInquiry.findMany({
    where: { lgaId },
    include: { investor: true, endowment: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ inquiries });
}
