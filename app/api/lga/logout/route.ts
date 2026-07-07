import { NextResponse } from "next/server";
import { clearLgaSessionCookie } from "@/lib/lga-auth";

// POST /api/lga/logout — clear the LGA session cookie.
export async function POST() {
  const res = NextResponse.json({ success: true });
  clearLgaSessionCookie(res);
  return res;
}
