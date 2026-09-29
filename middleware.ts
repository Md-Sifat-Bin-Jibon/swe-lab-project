import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const COOKIE_NAME = "swapspot_token";
const ADMIN_COOKIE = "swapspot_admin";

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/swaps",
  "/browse",
  "/chat",
  "/profiles",
  "/profile",
  "/onboarding",
  "/verify",
  "/wallet",
];

function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Admin panel: /admin is the login page, everything under it needs a session.
  if (pathname.startsWith("/admin")) {
    if (pathname === "/admin") return NextResponse.next();
    if (!request.cookies.get(ADMIN_COOKIE)?.value) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = "/admin";
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  if (
    pathname.startsWith("/api/auth") ||
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === "/signup" ||
    pathname === "/otp" ||
    pathname === "/forgot-password" ||
    pathname === "/reset-password" ||
    pathname === "/"
  ) {
    return NextResponse.next();
  }

  if (!isProtectedPath(pathname)) {
    return NextResponse.next();
  }

  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!token) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/swaps/:path*",
    "/browse/:path*",
    "/chat/:path*",
    "/profiles/:path*",
    "/profile",
    "/profile/:path*",
    "/onboarding/:path*",
    "/admin/:path*",
    "/verify",
    "/wallet",
  ],
};
