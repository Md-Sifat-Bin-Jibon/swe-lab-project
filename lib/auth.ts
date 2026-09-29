import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";

export const JWT_SECRET =
  process.env.JWT_SECRET || "swapspot-dev-secret-change-me";

export const COOKIE_NAME = "swapspot_token";

const TOKEN_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

type TokenPayload = {
  sub: string;
  /** Admin tokens carry typ: "admin" and are never valid for member routes. */
  typ?: string;
};

export function signToken(userId: string): string {
  return jwt.sign({ sub: userId }, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string): string | null {
  try {
    const payload = jwt.verify(token, JWT_SECRET) as TokenPayload;
    if (payload.typ === "admin") return null;
    return payload.sub ?? null;
  } catch {
    return null;
  }
}

function readCookie(request: Request, name: string): string | null {
  const header = request.headers.get("cookie");
  if (!header) return null;

  const parts = header.split(";");
  for (const part of parts) {
    const [rawKey, ...rest] = part.trim().split("=");
    if (rawKey === name) {
      return decodeURIComponent(rest.join("="));
    }
  }
  return null;
}

export function getUserIdFromRequest(request: Request): string | null {
  const header = request.headers.get("authorization") || "";
  const bearer = header.startsWith("Bearer ") ? header.slice(7).trim() : null;
  const cookieToken = readCookie(request, COOKIE_NAME);
  const token = bearer || cookieToken;

  if (!token) return null;
  return verifyToken(token);
}

export function unauthorizedResponse(
  message = "Authentication required."
): NextResponse {
  return NextResponse.json({ error: message }, { status: 401 });
}

/** Returns userId or a 401 NextResponse. */
export function requireUserId(
  request: Request
): { userId: string } | { response: NextResponse } {
  const userId = getUserIdFromRequest(request);
  if (!userId) {
    return { response: unauthorizedResponse() };
  }
  return { userId };
}

export function setAuthCookie(response: NextResponse, token: string): void {
  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: TOKEN_MAX_AGE_SECONDS,
    secure: process.env.NODE_ENV === "production",
  });
}

export function clearAuthCookie(response: NextResponse): void {
  response.cookies.set(COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
    secure: process.env.NODE_ENV === "production",
  });
}
