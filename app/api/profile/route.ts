import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { updateProfileSchema } from "@/lib/validations";
import { sanitizeInput } from "@/lib/utils";

const MAX_IMAGE_BYTES = 2 * 1024 * 1024;

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      state: true,
      lga: true,
      image: true,
      role: true,
      createdAt: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  return NextResponse.json({ user });
}

export async function PATCH(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const body = await request.json();
    const { image: imageData, ...profileData } = body;

    // Validate profile fields
    const parsed = updateProfileSchema.safeParse(profileData);
    if (!parsed.success) {
      const firstError = Object.values(parsed.error.flatten().fieldErrors)[0]?.[0] ?? "Invalid input.";
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    const { name, phone, state, lga } = parsed.data;

    let imageUrl: string | undefined;

    // Handle image upload — stored as a data URI in the database. The app runs on
    // serverless hosting where the local filesystem is read-only outside /tmp and
    // isn't persisted or publicly served, so writing to public/uploads silently
    // loses the file after the request completes.
    if (imageData && typeof imageData === "string") {
      const matches = imageData.match(/^data:image\/(png|jpe?g|webp|gif);base64,([a-zA-Z0-9+/]+=*)$/);
      if (!matches) {
        return NextResponse.json({ error: "Unsupported image format." }, { status: 400 });
      }
      const base64Data = matches[2];
      const byteLength = Math.ceil((base64Data.length * 3) / 4);
      if (byteLength > MAX_IMAGE_BYTES) {
        return NextResponse.json({ error: "Image must be under 2MB." }, { status: 400 });
      }
      imageUrl = imageData;
    }

    // Update user
    const updatedUser = await db.user.update({
      where: { id: session.user.id },
      data: {
        name: sanitizeInput(name),
        phone: phone || null,
        state: state || null,
        lga: lga ? sanitizeInput(lga) : null,
        ...(imageUrl ? { image: imageUrl } : {}),
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        state: true,
        lga: true,
        image: true,
        role: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error) {
    console.error("[PATCH /api/profile]", error);
    return NextResponse.json(
      { error: "Internal server error. Please try again." },
      { status: 500 }
    );
  }
}
