import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import {
  logAdminAction,
  setAdminCookie,
  signAdminToken,
  toAdminUser,
  type AdminRow,
} from "@/lib/adminAuth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const email = String(body.email || "").trim().toLowerCase();
  const password = String(body.password || "");

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
  }

  const db = getDb();
  const admin = db.prepare("SELECT * FROM admins WHERE lower(email) = ?").get(email) as AdminRow | undefined;

  // Same message either way so the form can't be used to discover admin emails.
  if (!admin || !bcrypt.compareSync(password, admin.password_hash)) {
    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  }

  db.prepare("UPDATE admins SET last_login_at = ? WHERE id = ?").run(new Date().toISOString(), admin.id);
  logAdminAction(db, admin.id, "admin.login", { type: "admin", id: admin.id });

  const response = NextResponse.json({ admin: toAdminUser(admin) });
  setAdminCookie(response, signAdminToken(admin.id));
  return response;
}
