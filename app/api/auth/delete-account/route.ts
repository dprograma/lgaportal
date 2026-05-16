import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function DELETE() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const userId = session.user.id;

    // Delete user — Prisma cascade handles accounts, sessions, tokens
    await db.user.delete({ where: { id: userId } });

    return NextResponse.json({ success: true, message: "Account deleted successfully." });
  } catch (error) {
    console.error("[DELETE /api/auth/delete-account]", error);
    return NextResponse.json(
      { error: "Internal server error. Please try again." },
      { status: 500 }
    );
  }
}
