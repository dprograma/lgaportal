import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { rateLimit, getClientIP } from "@/lib/rate-limit";
import { otpVerifySchema } from "@/lib/validations";

export async function POST(request: Request) {
  const ip = getClientIP(request);
  const { success, retryAfter } = rateLimit(`otp-verify:${ip}`, {
    maxRequests: 10,
    windowMs: 15 * 60 * 1000,
    blockDurationMs: 15 * 60 * 1000,
  });

  if (!success) {
    return NextResponse.json(
      { error: `Too many attempts. Try again in ${retryAfter} seconds.` },
      { status: 429 }
    );
  }

  try {
    const body = await request.json();
    const parsed = otpVerifySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const { identifier, code, purpose } = parsed.data;
    const sanitizedIdentifier = identifier.toLowerCase().trim();

    // Find the most recent valid OTP
    const otp = await db.oTPCode.findFirst({
      where: {
        identifier: sanitizedIdentifier,
        purpose,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!otp) {
      return NextResponse.json(
        { error: "OTP has expired or does not exist. Please request a new one." },
        { status: 400 }
      );
    }

    // Check if locked
    if (otp.lockedUntil && otp.lockedUntil > new Date()) {
      const secondsLeft = Math.ceil((otp.lockedUntil.getTime() - Date.now()) / 1000);
      return NextResponse.json(
        { error: `Too many failed attempts. Try again in ${secondsLeft} seconds.`, locked: true },
        { status: 429 }
      );
    }

    // Wrong code
    if (otp.code !== code) {
      const newAttempts = otp.attempts + 1;
      const updateData: { attempts: number; lockedUntil?: Date } = { attempts: newAttempts };

      if (newAttempts >= 3) {
        updateData.lockedUntil = new Date(Date.now() + 15 * 60 * 1000);
      }

      await db.oTPCode.update({ where: { id: otp.id }, data: updateData });

      const remaining = Math.max(0, 3 - newAttempts);
      return NextResponse.json(
        {
          error: remaining > 0
            ? `Incorrect OTP. ${remaining} attempt${remaining === 1 ? "" : "s"} remaining.`
            : "Too many failed attempts. You are locked out for 15 minutes.",
          attemptsRemaining: remaining,
        },
        { status: 400 }
      );
    }

    // Mark OTP as used
    await db.oTPCode.update({ where: { id: otp.id }, data: { usedAt: new Date() } });

    return NextResponse.json({ success: true, message: "OTP verified successfully." });
  } catch (error) {
    console.error("[POST /api/otp/verify]", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
