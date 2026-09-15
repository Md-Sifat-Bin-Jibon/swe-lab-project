import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const COOKIE_NAME = "swapspot_token";

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/swaps",
  "/browse",
  "/chat",
  "/profiles",
  "/profile",
  "/onboarding",
];

function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/api/auth") ||
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === "/signup" ||
    pathname === "/otp" ||
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
  ],
};
