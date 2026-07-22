import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";
import { extractAllocationRows } from "@/lib/pdf-table-extract";

const MAX_PDF_BYTES = 20 * 1024 * 1024; // 20MB — generous for a monthly report

// POST /api/admin/allocations/pdf-extract — { pdfUrl } pointing at a PDF
// already uploaded to Cloudinary (see /api/admin/uploads/signature). Fetches
// it server-side (so there's no client request-body size limit) and returns
// a best-effort row extraction for the admin to review before import.
export async function POST(req: NextRequest) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  let body: Record<string, unknown> = {};
  try { body = await req.json(); } catch { /* ok */ }
  const pdfUrl = typeof body.pdfUrl === "string" ? body.pdfUrl : "";
  if (!pdfUrl.startsWith("https://res.cloudinary.com/")) {
    return NextResponse.json({ error: "pdfUrl must be a Cloudinary URL from the upload step." }, { status: 400 });
  }

  let buffer: Buffer;
  try {
    const res = await fetch(pdfUrl);
    if (!res.ok) throw new Error(`Fetch failed with ${res.status}`);
    const contentLength = Number(res.headers.get("content-length") ?? "0");
    if (contentLength > MAX_PDF_BYTES) {
      return NextResponse.json({ error: "PDF is too large (max 20MB)." }, { status: 413 });
    }
    buffer = Buffer.from(await res.arrayBuffer());
  } catch (e) {
    console.error("PDF fetch error:", e);
    return NextResponse.json({ error: "Could not download the uploaded file." }, { status: 502 });
  }

  try {
    const rows = await extractAllocationRows(buffer);
    return NextResponse.json({ rows, total: rows.length });
  } catch (e) {
    console.error("PDF extraction error:", e);
    return NextResponse.json({ error: "Could not read this PDF. It may be scanned/image-based rather than text." }, { status: 422 });
  }
}
