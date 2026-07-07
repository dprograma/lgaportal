import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { rateLimit, getClientIP } from "@/lib/rate-limit";
import { lgaLoginSchema } from "@/lib/validations";

/** Authenticate an LGA staff member (delegated publisher) by email + password. */
async function tryStaffLogin(email: string, password: string): Promise<NextResponse> {
  const staff = await db.lGAStaff.findUnique({
    where: { email },
    include: { lga: { select: { lgaName: true, state: true, status: true } } },
  });

  if (!staff || !staff.password) {
    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  }

  const isMatch = await bcrypt.compare(password, staff.password);
  if (!isMatch) {
    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  }

  if (!staff.isActive) {
    return NextResponse.json({ error: "Your account has been deactivated." }, { status: 403 });
  }

  if (staff.lga.status === "SUSPENDED") {
    return NextResponse.json({ error: "SUSPENDED" }, { status: 403 });
  }
  if (staff.lga.status === "DEACTIVATED" || staff.lga.status === "REJECTED") {
    return NextResponse.json(
      { error: "Your LGA account is no longer active. Please contact support." },
      { status: 403 }
    );
  }

  return NextResponse.json({
    success: true,
    staff: {
      id: staff.id,
      lgaId: staff.lgaId,
      lgaName: staff.lga.lgaName,
      state: staff.lga.state,
      status: staff.lga.status,
      name: staff.name,
      role: "STAFF",
      canPublish: staff.canPublish,
    },
  });
}

export async function POST(request: Request) {
  // Rate limit: 5 per 15 minutes per IP
  const ip = getClientIP(request);
  const { success, retryAfter } = rateLimit(`lga-login:${ip}`, {
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
    const parsed = lgaLoginSchema.safeParse(body);

    if (!parsed.success) {
      const firstError = Object.values(parsed.error.flatten().fieldErrors)[0]?.[0] ?? "Invalid input.";
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    const { email, password } = parsed.data;
    const sanitizedEmail = email.toLowerCase().trim();

    // Find chairman with LGA info
    const chairman = await db.lGAChairman.findUnique({
      where: { email: sanitizedEmail },
      include: {
        lga: {
          select: {
            id: true,
            lgaName: true,
            chairmanName: true,
            state: true,
            status: true,
          },
        },
      },
    });

    // Not a chairman — the email may belong to an LGA staff member.
    if (!chairman) {
      return await tryStaffLogin(sanitizedEmail, password);
    }

    if (!chairman.password) {
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, chairman.password);
    if (!isMatch) {
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    }

    // Check email verified
    if (!chairman.emailVerified) {
      return NextResponse.json(
        { error: "UNVERIFIED", email: chairman.email },
        { status: 403 }
      );
    }

    // Check LGA status
    if (chairman.lga.status === "SUSPENDED") {
      return NextResponse.json({ error: "SUSPENDED" }, { status: 403 });
    }

    if (chairman.lga.status === "DEACTIVATED" || chairman.lga.status === "REJECTED") {
      return NextResponse.json(
        { error: "Your LGA account is no longer active. Please contact support." },
        { status: 403 }
      );
    }

    // Check chairman active status
    if (!chairman.isActive) {
      return NextResponse.json({ error: "Your account has been deactivated." }, { status: 403 });
    }

    // Return chairman info (no JWT for now — can integrate jose if needed)
    return NextResponse.json({
      success: true,
      chairman: {
        id: chairman.id,
        lgaId: chairman.lgaId,
        lgaName: chairman.lga.lgaName,
        chairmanName: chairman.lga.chairmanName,
        state: chairman.lga.state,
        status: chairman.lga.status,
      },
    });
  } catch (error) {
    console.error("[POST /api/lga/login]", error);
    return NextResponse.json(
      { error: "Internal server error. Please try again." },
      { status: 500 }
    );
  }
}
