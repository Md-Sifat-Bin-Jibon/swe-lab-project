import { NextResponse } from "next/server";
import { setAuthCookie, signToken } from "@/lib/auth";
import { getDb } from "@/lib/db";
import type { UserRow } from "@/lib/format";
import { loadSessionUser } from "@/lib/users";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const email = String(body.email || "")
    .trim()
    .toLowerCase();
  const code = String(body.code || "").trim();

  if (!email || !code) {
    return NextResponse.json(
      { error: "Email and OTP code are required." },
      { status: 400 }
    );
  }

  const db = getDb();
  const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email) as
    | UserRow
    | undefined;

  if (!user) {
    return NextResponse.json({ error: "Account not found." }, { status: 404 });
  }

  const otp = db.prepare("SELECT * FROM otp_codes WHERE email = ?").get(email) as
    | { email: string; code: string; expires_at: string }
    | undefined;

  if (!otp || otp.code !== code) {
    return NextResponse.json({ error: "Invalid OTP code." }, { status: 400 });
  }

  if (new Date(otp.expires_at).getTime() < Date.now()) {
    return NextResponse.json(
      { error: "OTP code has expired." },
      { status: 400 }
    );
  }

  db.prepare("UPDATE users SET email_verified = 1 WHERE id = ?").run(user.id);
  db.prepare("DELETE FROM otp_codes WHERE email = ?").run(email);

  const token = signToken(user.id);
  const sessionUser = loadSessionUser(db, user.id);
  const response = NextResponse.json({ token, user: sessionUser });
  setAuthCookie(response, token);
  return response;
}
