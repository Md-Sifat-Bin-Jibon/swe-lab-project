import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export const runtime = "nodejs";

function createOtp(email: string): string {
  const db = getDb();
  const code = "123456";
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

  db.prepare(
    `INSERT INTO otp_codes (email, code, expires_at) VALUES (?, ?, ?)
     ON CONFLICT(email) DO UPDATE SET code = excluded.code, expires_at = excluded.expires_at`
  ).run(email.toLowerCase(), code, expiresAt);

  return code;
}

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

  createOtp(email);

  return NextResponse.json(
    {
      message: "Account created. Verify your email with the OTP sent to you.",
      email,
      demoOtp: "123456",
    },
    { status: 201 }
  );
}
