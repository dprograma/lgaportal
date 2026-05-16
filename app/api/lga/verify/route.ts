import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { rateLimit, getClientIP } from "@/lib/rate-limit";

export async function POST(request: Request) {
  // Rate limit: 10 per 15 minutes per IP
  const ip = getClientIP(request);
  const { success, retryAfter } = rateLimit(`lga-verify:${ip}`, {
    maxRequests: 10,
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
    const { token } = body;

    if (!token || typeof token !== "string") {
      return NextResponse.json({ error: "Invalid token." }, { status: 400 });
    }

    // Find the LGA verification token
    const verificationToken = await db.lGAVerificationToken.findUnique({
      where: { token },
      include: {
        chairman: {
          select: { id: true, emailVerified: true },
        },
      },
    });

    if (!verificationToken) {
      return NextResponse.json(
        { error: "This verification link is invalid." },
        { status: 400 }
      );
    }

    if (verificationToken.expires < new Date()) {
      await db.lGAVerificationToken.delete({ where: { id: verificationToken.id } });
      return NextResponse.json(
        { error: "This verification link has expired. Please request a new one." },
        { status: 400 }
      );
    }

    if (verificationToken.chairman.emailVerified) {
      await db.lGAVerificationToken.delete({ where: { id: verificationToken.id } });
      return NextResponse.json({ success: true, message: "Email already verified." });
    }

    // Mark email as verified and delete token (atomic)
    await db.$transaction([
      db.lGAChairman.update({
        where: { id: verificationToken.chairmanId },
        data: { emailVerified: new Date() },
      }),
      db.lGAVerificationToken.delete({ where: { id: verificationToken.id } }),
    ]);

    return NextResponse.json({ success: true, message: "Email verified successfully." });
  } catch (error) {
    console.error("[POST /api/lga/verify]", error);
    return NextResponse.json(
      { error: "Internal server error. Please try again." },
      { status: 500 }
    );
  }
}
