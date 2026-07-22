import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";
import { createUploadSignature, isCloudinaryConfigured } from "@/lib/cloudinary";

// POST /api/admin/uploads/signature — mints a short-lived signature so admin
// can upload a file (e.g. a FAAC disbursement PDF) directly to Cloudinary,
// bypassing this server's own request-body size limit.
export async function POST(req: NextRequest) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  if (!isCloudinaryConfigured()) {
    return NextResponse.json({ error: "File uploads are not configured yet." }, { status: 503 });
  }

  const signature = createUploadSignature("lga-portal/admin-imports");
  return NextResponse.json(signature);
}
