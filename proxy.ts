import { auth } from "@/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const authRoutes = ["/login", "/signup", "/lga-login", "/lga-signup"];
const protectedRoutes = ["/profile", "/settings"];

function addSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  return response;
}

export default auth(function middleware(request: NextRequest & { auth: { user?: { id: string; email?: string | null } } | null }) {
  const { pathname } = request.nextUrl;
  const session = request.auth;
  const isLoggedIn = !!session?.user;

  // Redirect logged-in users away from auth pages
  if (authRoutes.some((r) => pathname === r) && isLoggedIn) {
    return addSecurityHeaders(NextResponse.redirect(new URL("/profile", request.url)));
  }

  // Protect dashboard routes
  if (protectedRoutes.some((r) => pathname.startsWith(r)) && !isLoggedIn) {
    const callbackUrl = encodeURIComponent(pathname);
    return addSecurityHeaders(
      NextResponse.redirect(new URL(`/login?callbackUrl=${callbackUrl}`, request.url))
    );
  }

  return addSecurityHeaders(NextResponse.next());
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|public|images).*)"],
};
