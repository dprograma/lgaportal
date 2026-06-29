import { NextRequest, NextResponse } from "next/server";

const ADMIN_SECRET   = process.env.ADMIN_SECRET   ?? "";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? ADMIN_SECRET;
const COOKIE_NAME    = "admin_session";
const COOKIE_OPTS    = "HttpOnly; Path=/; SameSite=Lax; Max-Age=28800"; // 8 hours

function isAuthenticated(req: NextRequest) {
  return req.cookies.get(COOKIE_NAME)?.value === "authenticated";
}

// POST /api/admin/auth — verify password, set session cookie
export async function POST(req: NextRequest) {
  let body: { password?: string } = {};
  try { body = await req.json(); } catch { /* noop */ }

  if (!body.password || body.password !== ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Incorrect password." }, { status: 401 });
  }

  const res = NextResponse.json({ authenticated: true });
  res.headers.set("Set-Cookie", `${COOKIE_NAME}=authenticated; ${COOKIE_OPTS}`);
  return res;
}

// GET /api/admin/auth — return admin secret only to authenticated sessions
export async function GET(req: NextRequest) {
  if (!isAuthenticated(req)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  return NextResponse.json({ secret: ADMIN_SECRET });
}

// DELETE /api/admin/auth — logout, clear cookie
export async function DELETE() {
  const res = NextResponse.json({ success: true });
  res.headers.set("Set-Cookie", `${COOKIE_NAME}=; Path=/; Max-Age=0`);
  return res;
}
