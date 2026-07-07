import { NextRequest, NextResponse } from "next/server";
import { SignJWT, jwtVerify } from "jose";

/**
 * Verifiable LGA administrator session.
 *
 * LGA chairmen authenticate through /api/lga/login → OTP, which historically
 * only returned the lgaId for the client to stash in sessionStorage and echo
 * back via an `x-lga-id` header. That header is trivially spoofable — anyone
 * could act as any LGA by sending someone else's lgaId.
 *
 * This module issues a signed JWT (HS256, keyed on AUTH_SECRET) in an
 * HttpOnly cookie once identity is confirmed (after OTP), and verifies it on
 * every LGA-scoped request. The lgaId now comes from a signature the client
 * cannot forge, so a chairman can only ever act as their own LGA.
 */

export const LGA_SESSION_COOKIE = "lga_session";
const MAX_AGE_SECONDS = 60 * 60 * 8; // 8 hours — matches the admin session

function secretKey(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is not set — cannot sign LGA sessions.");
  return new TextEncoder().encode(secret);
}

export type LgaRole = "CHAIRMAN" | "STAFF";

export interface LgaSession {
  lgaId: string;
  /** The supervising chairman's id (the chairman's own id when role is CHAIRMAN). */
  chairmanId: string;
  role: LgaRole;
  /** Whether this principal may publish/modify LGA content. Chairmen: always true. */
  canPublish: boolean;
  /** Present only for staff sessions. */
  staffId?: string;
}

/** Sign a short-lived JWT for an authenticated LGA principal (chairman or staff). */
export async function signLgaSession(session: LgaSession): Promise<string> {
  return new SignJWT({
    lgaId: session.lgaId,
    chairmanId: session.chairmanId,
    role: session.role,
    canPublish: session.canPublish,
    ...(session.staffId ? { staffId: session.staffId } : {}),
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE_SECONDS}s`)
    .sign(secretKey());
}

/** Verify the LGA session cookie on a request; returns null when absent/invalid. */
export async function getLgaSession(req: NextRequest): Promise<LgaSession | null> {
  const token = req.cookies.get(LGA_SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey());
    const { lgaId, chairmanId, role, canPublish, staffId } = payload as Record<string, unknown>;
    if (typeof lgaId !== "string" || typeof chairmanId !== "string") return null;
    return {
      lgaId,
      chairmanId,
      // Backward-compatible defaults for any pre-existing chairman-only tokens.
      role: role === "STAFF" ? "STAFF" : "CHAIRMAN",
      canPublish: typeof canPublish === "boolean" ? canPublish : true,
      ...(typeof staffId === "string" ? { staffId } : {}),
    };
  } catch {
    return null;
  }
}

/**
 * Require a caller who may publish/modify LGA content (chairman, or staff with
 * canPublish). Returns the session, or a 401/403 NextResponse to return as-is.
 */
export async function requirePublisher(req: NextRequest): Promise<LgaSession | NextResponse> {
  const session = await getLgaSession(req);
  if (!session) {
    return NextResponse.json({ error: "LGA authentication required." }, { status: 401 });
  }
  if (!session.canPublish) {
    return NextResponse.json({ error: "You do not have publishing permission." }, { status: 403 });
  }
  return session;
}

/**
 * Require the LGA chairman (not a staff member). Returns the session, or a
 * 401/403 NextResponse to return as-is.
 */
export async function requireChairman(req: NextRequest): Promise<LgaSession | NextResponse> {
  const session = await getLgaSession(req);
  if (!session) {
    return NextResponse.json({ error: "LGA authentication required." }, { status: 401 });
  }
  if (session.role !== "CHAIRMAN") {
    return NextResponse.json({ error: "Only the LGA chairman can perform this action." }, { status: 403 });
  }
  return session;
}

/** Attach the signed session cookie to a response (call after OTP success). */
export function setLgaSessionCookie(res: NextResponse, token: string): void {
  res.cookies.set(LGA_SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: MAX_AGE_SECONDS,
  });
}

/** Clear the session cookie (logout). */
export function clearLgaSessionCookie(res: NextResponse): void {
  res.cookies.set(LGA_SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: 0,
  });
}
