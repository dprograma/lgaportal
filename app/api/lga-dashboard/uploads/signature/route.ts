import { NextRequest, NextResponse } from "next/server";
import { requirePublisher } from "@/lib/lga-auth";
import { createUploadSignature, isCloudinaryConfigured } from "@/lib/cloudinary";

const ALLOWED_FOLDERS = new Set(["projects", "press-releases"]);

// POST /api/lga-dashboard/uploads/signature — issues a short-lived signature
// so the browser can upload a file directly to Cloudinary. Requires an LGA
// session so only an authenticated chairman/staff can mint one.
export async function POST(req: NextRequest) {
  const session = await requirePublisher(req);
  if (session instanceof NextResponse) return session;

  let body: Record<string, unknown> = {};
  try { body = await req.json(); } catch { /* ok */ }
  const folderKey = typeof body.folder === "string" ? body.folder : "";
  if (!ALLOWED_FOLDERS.has(folderKey)) {
    return NextResponse.json({ error: "Invalid upload folder." }, { status: 400 });
  }

  if (!isCloudinaryConfigured()) {
    return NextResponse.json({ error: "File uploads are not configured yet." }, { status: 503 });
  }

  const signature = createUploadSignature(`lga-portal/${folderKey}/${session.lgaId}`);
  return NextResponse.json(signature);
}
