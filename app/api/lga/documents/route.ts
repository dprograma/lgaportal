import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { sendAdminDocumentNotification } from "@/lib/email";

const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

const docSchema = z.object({
  lgaId: z.string().min(1, "LGA ID is required"),
  documents: z.array(
    z.object({
      docType: z.string().min(1),
      fileData: z.string().min(1, "File data is required"), // base64
      fileName: z.string().min(1),
      fileSize: z.number().max(MAX_SIZE_BYTES, "File must be under 5MB"),
      mimeType: z.string().refine(
        (v) => ["application/pdf", "image/jpeg", "image/jpg", "image/png"].includes(v),
        "Only PDF, JPG, and PNG files are accepted"
      ),
    })
  ).min(1, "At least one document is required"),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = docSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const { lgaId, documents } = parsed.data;

    // Verify LGA exists
    const lga = await db.lGA.findUnique({
      where: { id: lgaId },
      select: { id: true, lgaName: true, email: true, chairmanName: true },
    });

    if (!lga) {
      return NextResponse.json({ error: "LGA not found." }, { status: 404 });
    }

    // Delete existing pending docs for this LGA (allow re-submission)
    await db.lGAVerificationDoc.deleteMany({
      where: { lgaId, status: "PENDING" },
    });

    // Create new doc records (store base64 as fileUrl for now)
    await db.lGAVerificationDoc.createMany({
      data: documents.map((doc) => ({
        lgaId,
        docType: doc.docType,
        fileUrl: `data:${doc.mimeType};base64,${doc.fileData}`,
        status: "PENDING" as const,
      })),
    });

    // Notify admin
    try {
      await sendAdminDocumentNotification({
        lgaName: lga.lgaName,
        chairmanName: lga.chairmanName,
        lgaEmail: lga.email,
        docCount: documents.length,
      });
    } catch (emailErr) {
      console.error("[docs] admin email failed:", emailErr);
    }

    return NextResponse.json({
      success: true,
      message: "Documents submitted for review. Admin will review within 3–5 business days.",
    });
  } catch (error) {
    console.error("[POST /api/lga/documents]", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const lgaId = new URL(request.url).searchParams.get("lgaId");
  if (!lgaId) return NextResponse.json({ error: "lgaId required." }, { status: 400 });

  const docs = await db.lGAVerificationDoc.findMany({
    where: { lgaId },
    select: { id: true, docType: true, status: true, uploadedAt: true },
    orderBy: { uploadedAt: "desc" },
  });

  return NextResponse.json({ docs });
}
