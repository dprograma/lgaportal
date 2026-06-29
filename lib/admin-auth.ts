import { NextRequest } from "next/server";

const ADMIN_SECRET = process.env.ADMIN_SECRET ?? "";

/**
 * Returns true if the request is from an authenticated admin.
 * Accepts either:
 *   - A valid httpOnly session cookie set by POST /api/admin/auth
 *   - An x-admin-secret header matching ADMIN_SECRET env var
 */
export function isAdminRequest(req: NextRequest): boolean {
  if (req.cookies.get("admin_session")?.value === "authenticated") return true;
  if (ADMIN_SECRET && req.headers.get("x-admin-secret") === ADMIN_SECRET) return true;
  return false;
}
