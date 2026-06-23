import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { rateLimit, getClientIP } from "@/lib/rate-limit";
import { otpSendSchema } from "@/lib/validations";
import { sendOTPEmail } from "@/lib/email";

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(request: Request) {
  const ip = getClientIP(request);
  const { success, retryAfter } = rateLimit(`otp-send:${ip}`, {
    maxRequests: 5,
    windowMs: 10 * 60 * 1000,
    blockDurationMs: 10 * 60 * 1000,
  });

  if (!success) {
    return NextResponse.json(
      { error: `Too many OTP requests. Try again in ${retryAfter} seconds.` },
      { status: 429 }
    );
  }

  try {
    const body = await request.json();
    const parsed = otpSendSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { identifier, purpose } = parsed.data;
    const sanitizedIdentifier = identifier.toLowerCase().trim();

    // Per-identifier rate limit: 5 sends per 10 min
    const identifierLimit = rateLimit(`otp-send-id:${sanitizedIdentifier}`, {
      maxRequests: 5,
      windowMs: 10 * 60 * 1000,
      blockDurationMs: 10 * 60 * 1000,
    });

    if (!identifierLimit.success) {
      return NextResponse.json(
        { error: `Too many OTP requests for this email. Try again in ${identifierLimit.retryAfter} seconds.` },
        { status: 429 }
      );
    }

    // Check if there's a recent (resend cooldown: 60s) unused OTP
    const recentOTP = await db.oTPCode.findFirst({
      where: {
        identifier: sanitizedIdentifier,
        purpose,
        usedAt: null,
        expiresAt: { gt: new Date() },
        createdAt: { gt: new Date(Date.now() - 60 * 1000) },
      },
      orderBy: { createdAt: "desc" },
    });

    if (recentOTP) {
      const secondsLeft = Math.ceil(
        (recentOTP.createdAt.getTime() + 60 * 1000 - Date.now()) / 1000
      );
      return NextResponse.json(
        { error: `Please wait ${secondsLeft} seconds before requesting a new code.`, retryAfter: secondsLeft },
        { status: 429 }
      );
    }

    // Invalidate old OTPs for this identifier/purpose
    await db.oTPCode.updateMany({
      where: {
        identifier: sanitizedIdentifier,
        purpose,
        usedAt: null,
      },
      data: { usedAt: new Date() },
    });

    // Generate new OTP
    const code = generateOTP();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    await db.oTPCode.create({
      data: {
        identifier: sanitizedIdentifier,
        code,
        purpose,
        expiresAt,
      },
    });

    // Send email (non-fatal — code is stored in DB regardless)
    try {
      await sendOTPEmail(sanitizedIdentifier, code, purpose);
    } catch (emailErr) {
      console.error("[POST /api/otp/send] email send failed:", emailErr);
    }

    return NextResponse.json({
      success: true,
      message: "OTP sent to your email address.",
      expiresIn: 300, // 5 minutes in seconds
    });
  } catch (error) {
    console.error("[POST /api/otp/send]", error);
    return NextResponse.json(
      { error: "Internal server error. Please try again." },
      { status: 500 }
    );
  }
}
