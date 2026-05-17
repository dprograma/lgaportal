import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { sendInvestorWelcomeEmail } from "@/lib/email";

const schema = z.object({
  fullName:    z.string().min(2).max(100),
  email:       z.string().email(),
  phone:       z.string().optional(),
  company:     z.string().optional(),
  country:     z.string().min(2),
  sectors:     z.array(z.string()).min(1, "Select at least one sector"),
  minBudget:   z.string().optional(),
  maxBudget:   z.string().optional(),
  description: z.string().max(1000).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = schema.parse(body);

    const existing = await db.investor.findUnique({ where: { email: data.email } });
    if (existing) {
      return NextResponse.json(
        { error: "An investor profile with this email already exists." },
        { status: 409 }
      );
    }

    const investor = await db.investor.create({ data });

    // Best-effort welcome email — don't fail the request if it errors
    try {
      await sendInvestorWelcomeEmail(investor.email, investor.fullName);
    } catch (_) {}

    return NextResponse.json({ success: true, investorId: investor.id }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0].message }, { status: 422 });
    }
    console.error("Investor register error:", err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
