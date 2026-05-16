import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { updateProfileSchema } from "@/lib/validations";
import { sanitizeInput } from "@/lib/utils";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";

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

    // Handle image upload (base64)
    if (imageData && typeof imageData === "string" && imageData.startsWith("data:image/")) {
      try {
        const matches = imageData.match(/^data:image\/(\w+);base64,(.+)$/);
        if (matches) {
          const ext = matches[1];
          const base64Data = matches[2];
          const buffer = Buffer.from(base64Data, "base64");

          if (buffer.length > 2 * 1024 * 1024) {
            return NextResponse.json({ error: "Image must be under 2MB." }, { status: 400 });
          }

          const uploadsDir = join(process.cwd(), "public", "uploads");
          await mkdir(uploadsDir, { recursive: true });

          const filename = `${session.user.id}-${Date.now()}.${ext}`;
          await writeFile(join(uploadsDir, filename), buffer);
          imageUrl = `/uploads/${filename}`;
        }
      } catch (imgError) {
        console.error("Image save error:", imgError);
        // Non-fatal — continue without updating image
      }
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
