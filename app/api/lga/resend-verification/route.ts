import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { rateLimit, getClientIP } from "@/lib/rate-limit";
import { generateToken } from "@/lib/utils";
import { sendLGAVerificationEmail } from "@/lib/email";
import { z } from "zod";

const schema = z.object({
  email: z.string().email(),
});

export async function POST(request: Request) {
  // Rate limit: 3 per hour per IP
  const ip = getClientIP(request);
  const { success, retryAfter } = rateLimit(`lga-resend-verification:${ip}`, {
    maxRequests: 3,
    windowMs: 60 * 60 * 1000,
    blockDurationMs: 60 * 60 * 1000,
  });

  if (!success) {
    return NextResponse.json(
      { error: `Too many requests. Try again in ${retryAfter} seconds.` },
      { status: 429 }
    );
  }

  try {
    const body = await request.json();
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid email address." }, { status: 400 });
    }

    const { email } = parsed.data;
    const sanitizedEmail = email.toLowerCase().trim();

    // Per-email rate limit
    const emailRl = rateLimit(`lga-resend-verification:email:${sanitizedEmail}`, {
      maxRequests: 3,
      windowMs: 60 * 60 * 1000,
      blockDurationMs: 60 * 60 * 1000,
    });

    if (!emailRl.success) {
      return NextResponse.json(
        { error: `Too many requests for this email. Try again in ${emailRl.retryAfter} seconds.` },
        { status: 429 }
      );
    }

    // Find chairman with LGA
    const chairman = await db.lGAChairman.findUnique({
      where: { email: sanitizedEmail },
      include: { lga: { select: { lgaName: true, chairmanName: true } } },
    });

    // Generic success if not found
    if (!chairman) {
      return NextResponse.json({ success: true });
    }

    if (chairman.emailVerified) {
      return NextResponse.json(
        { error: "This email is already verified. Please log in." },
        { status: 400 }
      );
    }

    // Delete old verification tokens
    await db.lGAVerificationToken.deleteMany({ where: { chairmanId: chairman.id } });

    // Generate new token
    const token = generateToken();
    await db.lGAVerificationToken.create({
      data: {
        chairmanId: chairman.id,
        token,
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    // Send LGA verification email
    await sendLGAVerificationEmail(chairman.email, chairman.lga.chairmanName, chairman.lga.lgaName, token);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[POST /api/lga/resend-verification]", error);
    return NextResponse.json(
      { error: "Internal server error. Please try again." },
      { status: 500 }
    );
  }
}
