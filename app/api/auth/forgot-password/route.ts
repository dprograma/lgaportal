import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { rateLimit, getClientIP } from "@/lib/rate-limit";
import { generateToken } from "@/lib/utils";
import { sendPasswordResetEmail } from "@/lib/email";
import { forgotPasswordSchema } from "@/lib/validations";

export async function POST(request: Request) {
  // Rate limit: 3 per hour per IP
  const ip = getClientIP(request);
  const { success, retryAfter } = rateLimit(`forgot-password:${ip}`, {
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
    const parsed = forgotPasswordSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid email address." }, { status: 400 });
    }

    const { email } = parsed.data;
    const sanitizedEmail = email.toLowerCase().trim();

    // Find user — return generic success even if not found (prevent enumeration)
    const user = await db.user.findUnique({
      where: { email: sanitizedEmail },
      select: { id: true, name: true, email: true },
    });

    if (!user) {
      return NextResponse.json({ success: true });
    }

    // Delete old reset tokens
    await db.passwordResetToken.deleteMany({ where: { userId: user.id } });

    // Generate new reset token (1 hour expiry)
    const token = generateToken();
    await db.passwordResetToken.create({
      data: {
        userId: user.id,
        token,
        expires: new Date(Date.now() + 60 * 60 * 1000),
      },
    });

    // Send password reset email
    await sendPasswordResetEmail(user.email, user.name, token);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[POST /api/auth/forgot-password]", error);
    return NextResponse.json(
      { error: "Internal server error. Please try again." },
      { status: 500 }
    );
  }
}
