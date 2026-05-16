import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { rateLimit, getClientIP } from "@/lib/rate-limit";
import { resetPasswordSchema } from "@/lib/validations";
import { z } from "zod";

const bodySchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8),
});

export async function POST(request: Request) {
  // Rate limit: 5 per 15 minutes per IP
  const ip = getClientIP(request);
  const { success, retryAfter } = rateLimit(`lga-reset-password:${ip}`, {
    maxRequests: 5,
    windowMs: 15 * 60 * 1000,
    blockDurationMs: 15 * 60 * 1000,
  });

  if (!success) {
    return NextResponse.json(
      { error: `Too many requests. Try again in ${retryAfter} seconds.` },
      { status: 429 }
    );
  }

  try {
    const body = await request.json();
    const parsedBody = bodySchema.safeParse(body);

    if (!parsedBody.success) {
      return NextResponse.json({ error: "Invalid request data." }, { status: 400 });
    }

    const { token, password } = parsedBody.data;

    // Validate password strength
    const pwValidation = resetPasswordSchema.safeParse({
      password,
      confirmPassword: password,
    });

    if (!pwValidation.success) {
      const firstError = Object.values(pwValidation.error.flatten().fieldErrors)[0]?.[0] ?? "Invalid password.";
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    // Find the reset token
    const resetToken = await db.lGAPasswordResetToken.findUnique({
      where: { token },
      include: { chairman: { select: { id: true } } },
    });

    if (!resetToken) {
      return NextResponse.json({ error: "This reset link is invalid." }, { status: 400 });
    }

    if (resetToken.used) {
      return NextResponse.json({ error: "This reset link has already been used." }, { status: 400 });
    }

    if (resetToken.expires < new Date()) {
      await db.lGAPasswordResetToken.delete({ where: { id: resetToken.id } });
      return NextResponse.json(
        { error: "This reset link has expired. Please request a new one." },
        { status: 400 }
      );
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Update password and mark token as used (atomic)
    await db.$transaction([
      db.lGAChairman.update({
        where: { id: resetToken.chairmanId },
        data: { password: hashedPassword },
      }),
      db.lGAPasswordResetToken.update({
        where: { id: resetToken.id },
        data: { used: true },
      }),
    ]);

    return NextResponse.json({ success: true, message: "Password reset successfully." });
  } catch (error) {
    console.error("[POST /api/lga/reset-password]", error);
    return NextResponse.json(
      { error: "Internal server error. Please try again." },
      { status: 500 }
    );
  }
}
