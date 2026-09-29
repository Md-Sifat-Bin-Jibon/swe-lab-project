import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { issueOtp } from "@/lib/otp";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const email = String(body.email || "")
    .trim()
    .toLowerCase();

  if (!email) {
    return NextResponse.json({ error: "Email is required." }, { status: 400 });
  }

  const db = getDb();
  const user = db
    .prepare("SELECT id, email_verified FROM users WHERE email = ?")
    .get(email) as { id: string; email_verified: number } | undefined;

  // Same response for unknown/verified emails so this can't be used to probe accounts.
  if (!user || user.email_verified) {
    return NextResponse.json({
      message: "If that account needs verification, a new code has been sent.",
    });
  }

  const result = await issueOtp(db, email);
  if (!result.ok) {
    if (result.reason === "cooldown") {
      return NextResponse.json(
        {
          error: `Please wait ${result.retryAfter}s before requesting another code.`,
          reason: "cooldown",
          retryAfter: result.retryAfter,
        },
        { status: 429 }
      );
    }
    return NextResponse.json(
      { error: "Could not send the verification email. Please try again later." },
      { status: 502 }
    );
  }

  return NextResponse.json({
    message: "A new verification code has been sent.",
    ...(result.devOtp ? { devOtp: result.devOtp } : {}),
  });
}
