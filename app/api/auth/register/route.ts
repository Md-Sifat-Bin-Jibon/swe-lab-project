import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { issueOtp } from "@/lib/otp";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const email = String(body.email || "")
    .trim()
    .toLowerCase();
  const password = String(body.password || "");
  const username = String(body.username || "").trim();

  if (!email || !password) {
    return NextResponse.json(
      { error: "Email and password are required." },
      { status: 400 }
    );
  }

  if (password.length < 8) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters." },
      { status: 400 }
    );
  }

  const db = getDb();
  const existing = db
    .prepare("SELECT id FROM users WHERE email = ?")
    .get(email) as { id: string } | undefined;

  if (existing) {
    return NextResponse.json(
      { error: "An account with this email already exists." },
      { status: 409 }
    );
  }

  const id = `user-${Date.now()}`;
  const passwordHash = bcrypt.hashSync(password, 10);

  db.prepare(
    `INSERT INTO users (id, email, password_hash, full_name, email_verified, onboarding_complete)
     VALUES (?, ?, ?, ?, 0, 0)`
  ).run(id, email, passwordHash, username || null);

  const otp = await issueOtp(db, email);
  const emailSent = otp.ok;

  return NextResponse.json(
    {
      message: emailSent
        ? "Account created. We've emailed you a 6-digit verification code."
        : "Account created, but we couldn't send the verification email. Please use Resend Code.",
      email,
      emailSent,
      ...(otp.ok && otp.devOtp ? { devOtp: otp.devOtp } : {}),
    },
    { status: 201 }
  );
}
