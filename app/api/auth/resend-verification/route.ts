import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { rateLimit, getClientIP } from "@/lib/rate-limit";
import { generateToken } from "@/lib/utils";
import { sendVerificationEmail } from "@/lib/email";
import { z } from "zod";

const schema = z.object({
  email: z.string().email(),
});

export async function POST(request: Request) {
  // Rate limit: 3 per hour per email
  const ip = getClientIP(request);
  const { success, retryAfter } = rateLimit(`resend-verification:${ip}`, {
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
    const emailRl = rateLimit(`resend-verification:email:${sanitizedEmail}`, {
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

    // Find user (generic response if not found to prevent enumeration)
    const user = await db.user.findUnique({
      where: { email: sanitizedEmail },
      select: { id: true, name: true, email: true, emailVerified: true },
    });

    if (!user) {
      // Return generic success to prevent email enumeration
      return NextResponse.json({ success: true });
    }

    if (user.emailVerified) {
      return NextResponse.json(
        { error: "This email is already verified. Please log in." },
        { status: 400 }
      );
    }

    // Delete old verification tokens
    await db.verificationToken.deleteMany({ where: { userId: user.id } });

    // Generate new token
    const token = generateToken();
    await db.verificationToken.create({
      data: {
        userId: user.id,
        token,
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    // Send verification email
    await sendVerificationEmail(user.email, user.name, token);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[POST /api/auth/resend-verification]", error);
    return NextResponse.json(
      { error: "Internal server error. Please try again." },
      { status: 500 }
    );
  }
}
