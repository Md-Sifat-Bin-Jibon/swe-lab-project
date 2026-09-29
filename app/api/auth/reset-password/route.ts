import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { checkOtp, OTP_ERROR_MESSAGES } from "@/lib/otp";

export const runtime = "nodejs";

/**
 * Body: { email, code, password? }
 * - Without `password`: only validates the code (it stays usable) so the UI
 *   can move to the "new password" step.
 * - With `password`: validates + consumes the code and sets the new password.
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const email = String(body.email || "")
    .trim()
    .toLowerCase();
  const code = String(body.code || "").trim();
  const password = body.password === undefined ? undefined : String(body.password);

  if (!email || !/^\d{6}$/.test(code)) {
    return NextResponse.json(
      { error: "Email and a 6-digit code are required." },
      { status: 400 }
    );
  }

  if (password !== undefined && password.length < 8) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters." },
      { status: 400 }
    );
  }

  const db = getDb();
  const user = db
    .prepare("SELECT id FROM users WHERE email = ?")
    .get(email) as { id: string } | undefined;

  if (!user) {
    // Don't reveal whether the account exists.
    return NextResponse.json(
      { error: OTP_ERROR_MESSAGES.invalid, reason: "invalid" },
      { status: 400 }
    );
  }

  const result = checkOtp(db, email, code, "reset", {
    consume: password !== undefined,
  });

  if (!result.ok) {
    return NextResponse.json(
      { error: OTP_ERROR_MESSAGES[result.reason], reason: result.reason },
      { status: result.reason === "too_many_attempts" ? 429 : 400 }
    );
  }

  if (password === undefined) {
    return NextResponse.json({ ok: true, valid: true });
  }

  const passwordHash = bcrypt.hashSync(password, 10);
  // Resetting via an emailed code also proves ownership of the address.
  db.prepare(
    "UPDATE users SET password_hash = ?, email_verified = 1 WHERE id = ?"
  ).run(passwordHash, user.id);

  return NextResponse.json({
    ok: true,
    message: "Your password has been reset. You can now log in.",
  });
}
