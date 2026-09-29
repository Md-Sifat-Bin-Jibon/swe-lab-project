import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";
import type { DatabaseSync } from "node:sqlite";
import { JWT_SECRET } from "@/lib/auth";
import { getDb } from "@/lib/db";

/**
 * Admin sessions are separate from member sessions: different cookie,
 * different table, and tokens are marked `typ: "admin"` so a member token
 * can never be used on an admin route (or the other way round).
 */
export const ADMIN_COOKIE = "swapspot_admin";
const MAX_AGE_SECONDS = 60 * 60 * 8;

export type AdminRow = {
  id: string;
  email: string;
  password_hash: string;
  name: string | null;
  role: "admin" | "owner";
  created_at: string;
  last_login_at: string | null;
};

export type AdminUser = { id: string; email: string; name: string; role: "admin" | "owner" };

export function signAdminToken(adminId: string): string {
  return jwt.sign({ sub: adminId, typ: "admin" }, JWT_SECRET, { expiresIn: "8h" });
}

function verifyAdminToken(token: string): string | null {
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { sub?: string; typ?: string };
    return payload.typ === "admin" && payload.sub ? payload.sub : null;
  } catch {
    return null;
  }
}

function readCookie(request: Request, name: string): string | null {
  const header = request.headers.get("cookie");
  if (!header) return null;
  for (const part of header.split(";")) {
    const [key, ...rest] = part.trim().split("=");
    if (key === name) return decodeURIComponent(rest.join("="));
  }
  return null;
}

export function setAdminCookie(response: NextResponse, token: string): void {
  response.cookies.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
    secure: process.env.NODE_ENV === "production",
  });
}

export function clearAdminCookie(response: NextResponse): void {
  response.cookies.set(ADMIN_COOKIE, "", { httpOnly: true, sameSite: "lax", path: "/", maxAge: 0 });
}

export function toAdminUser(row: AdminRow): AdminUser {
  return { id: row.id, email: row.email, name: row.name || row.email.split("@")[0], role: row.role };
}

/** Returns the signed-in admin, or a 401 response. */
export function requireAdmin(
  request: Request
): { db: DatabaseSync; admin: AdminRow } | { response: NextResponse } {
  const header = request.headers.get("authorization") || "";
  const bearer = header.startsWith("Bearer ") ? header.slice(7).trim() : null;
  const token = bearer || readCookie(request, ADMIN_COOKIE);
  const adminId = token ? verifyAdminToken(token) : null;
  if (!adminId) {
    return { response: NextResponse.json({ error: "Admin sign-in required." }, { status: 401 }) };
  }
  const db = getDb();
  const admin = db.prepare("SELECT * FROM admins WHERE id = ?").get(adminId) as AdminRow | undefined;
  if (!admin) {
    return { response: NextResponse.json({ error: "Admin account not found." }, { status: 401 }) };
  }
  return { db, admin };
}

/** Records every admin mutation so actions can be traced later. */
export function logAdminAction(
  db: DatabaseSync,
  adminId: string,
  action: string,
  target: { type?: string; id?: string | null },
  detail?: string | null
): void {
  db.prepare(
    "INSERT INTO admin_actions (admin_id, action, target_type, target_id, detail, created_at) VALUES (?, ?, ?, ?, ?, ?)"
  ).run(adminId, action, target.type ?? null, target.id ?? null, detail ?? null, new Date().toISOString());
}
