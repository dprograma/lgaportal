import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { rateLimit, getClientIP } from "@/lib/rate-limit";
import { lgaSignUpSchema } from "@/lib/validations";
import { generateToken, sanitizeInput } from "@/lib/utils";
import { sendLGAVerificationEmail } from "@/lib/email";

export async function POST(request: Request) {
  // Rate limit: 3 per hour per IP
  const ip = getClientIP(request);
  const { success, retryAfter } = rateLimit(`lga-register:${ip}`, {
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
    const parsed = lgaSignUpSchema.safeParse(body);

    if (!parsed.success) {
      const errors = parsed.error.flatten().fieldErrors;
      const firstError = Object.values(errors)[0]?.[0] ?? "Invalid input.";
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    const {
      lgaName,
      state,
      chairmanName,
      email,
      phone,
      officeAddress,
      population,
      description,
      sectors,
      password,
    } = parsed.data;

    const sanitizedEmail = email.toLowerCase().trim();

    // Check if LGA (name + state) already exists
    const existingLGA = await db.lGA.findUnique({
      where: { lgaName_state: { lgaName: sanitizeInput(lgaName), state } },
    });

    if (existingLGA) {
      return NextResponse.json(
        { error: "An LGA with this name and state is already registered." },
        { status: 409 }
      );
    }

    // Check if email already exists in LGAChairman
    const existingChairman = await db.lGAChairman.findUnique({
      where: { email: sanitizedEmail },
    });

    if (existingChairman) {
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Free trial: 3 months from now
    const freeUntil = new Date();
    freeUntil.setMonth(freeUntil.getMonth() + 3);

    // Create LGA and Chairman (atomic)
    const lga = await db.lGA.create({
      data: {
        lgaName: sanitizeInput(lgaName),
        state,
        chairmanName: sanitizeInput(chairmanName),
        email: sanitizedEmail,
        phone,
        officeAddress: sanitizeInput(officeAddress),
        population: population || null,
        description: description || null,
        sectors,
        status: "PENDING",
        isVerified: false,
        freeUntil,
        chairman: {
          create: {
            email: sanitizedEmail,
            password: hashedPassword,
            isActive: true,
          },
        },
      },
      include: { chairman: { select: { id: true } } },
    });

    const chairmanId = lga.chairman?.id;
    if (!chairmanId) throw new Error("Chairman not created.");

    // Generate verification token
    const token = generateToken();
    await db.lGAVerificationToken.create({
      data: {
        chairmanId,
        token,
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    // Send LGA verification email
    await sendLGAVerificationEmail(sanitizedEmail, sanitizeInput(chairmanName), sanitizeInput(lgaName), token);

    return NextResponse.json(
      { success: true, message: "LGA registered. Please verify your email." },
      { status: 201 }
    );
  } catch (error) {
    console.error("[POST /api/lga/register]", error);
    return NextResponse.json(
      { error: "Internal server error. Please try again." },
      { status: 500 }
    );
  }
}
