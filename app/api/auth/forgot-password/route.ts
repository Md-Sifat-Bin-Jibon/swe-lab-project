import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { issueOtp } from "@/lib/otp";

export const runtime = "nodejs";

const GENERIC_MESSAGE =
  "If an account exists for that email, we've sent a password reset code.";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const email = String(body.email || "")
    .trim()
    .toLowerCase();

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json(
      { error: "Please enter a valid email address." },
      { status: 400 }
    );
  }

  const db = getDb();
  const user = db
    .prepare("SELECT id FROM users WHERE email = ?")
    .get(email) as { id: string } | undefined;

  // Same response whether or not the account exists, so this endpoint
  // can't be used to discover registered emails.
  if (!user || email.endsWith("@profile.swapspot")) {
    return NextResponse.json({ message: GENERIC_MESSAGE });
  }

  const result = await issueOtp(db, email, "reset");
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
      { error: "Could not send the reset email. Please try again later." },
      { status: 502 }
    );
  }

  return NextResponse.json({
    message: GENERIC_MESSAGE,
    ...(result.devOtp ? { devOtp: result.devOtp } : {}),
  });
}
