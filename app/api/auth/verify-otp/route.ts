import { NextResponse } from "next/server";
import { setAuthCookie, signToken } from "@/lib/auth";
import { getDb } from "@/lib/db";
import type { UserRow } from "@/lib/format";
import { checkOtp } from "@/lib/otp";
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

  const result = checkOtp(db, email, code);
  if (!result.ok) {
    const messages = {
      invalid: "Invalid OTP code.",
      expired: "OTP code has expired. Please request a new one.",
      too_many_attempts: "Too many incorrect attempts. Please request a new code.",
    } as const;
    return NextResponse.json(
      { error: messages[result.reason], reason: result.reason },
      { status: result.reason === "too_many_attempts" ? 429 : 400 }
    );
  }

  db.prepare("UPDATE users SET email_verified = 1 WHERE id = ?").run(user.id);

  const token = signToken(user.id);
  const sessionUser = loadSessionUser(db, user.id);
  const response = NextResponse.json({ token, user: sessionUser });
  setAuthCookie(response, token);
  return response;
}
