import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { rateLimit, getClientIP } from "@/lib/rate-limit";
import { signUpSchema } from "@/lib/validations";
import { generateToken, sanitizeInput } from "@/lib/utils";
import { sendVerificationEmail } from "@/lib/email";

export async function POST(request: Request) {
  // Rate limit: 5 per 15 minutes per IP
  const ip = getClientIP(request);
  const { success, retryAfter } = rateLimit(`register:${ip}`, {
    maxRequests: 5,
    windowMs: 15 * 60 * 1000,
    blockDurationMs: 15 * 60 * 1000,
  });

  if (!success) {
    return NextResponse.json(
      { error: `Too many requests. Please try again in ${retryAfter} seconds.` },
      { status: 429 }
    );
  }

  try {
    const body = await request.json();

    // Validate input
    const parsed = signUpSchema.safeParse(body);
    if (!parsed.success) {
      const errors = parsed.error.flatten().fieldErrors;
      const firstError = Object.values(errors)[0]?.[0] ?? "Invalid input";
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    const { name, email, phone, state, lga, password } = parsed.data;

    // Sanitize inputs
    const sanitizedName = sanitizeInput(name);
    const sanitizedEmail = email.toLowerCase().trim();

    // Check if email already exists
    const existingUser = await db.user.findUnique({
      where: { email: sanitizedEmail },
      select: { id: true },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await db.user.create({
      data: {
        name: sanitizedName,
        email: sanitizedEmail,
        phone: phone || null,
        state: state || null,
        lga: lga ? sanitizeInput(lga) : null,
        password: hashedPassword,
        role: "CITIZEN",
      },
      select: { id: true, email: true, name: true },
    });

    // Generate verification token (24h expiry)
    const token = generateToken();
    await db.verificationToken.create({
      data: {
        userId: user.id,
        token,
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    // Send verification email (non-fatal — user can request resend)
    try {
      await sendVerificationEmail(user.email, user.name, token);
    } catch (emailErr) {
      console.error("[POST /api/auth/register] email send failed:", emailErr);
    }

    return NextResponse.json(
      { success: true, message: "Account created. Please check your email to verify your account." },
      { status: 201 }
    );
  } catch (error) {
    console.error("[POST /api/auth/register]", error);
    return NextResponse.json(
      { error: "Internal server error. Please try again." },
      { status: 500 }
    );
  }
}
