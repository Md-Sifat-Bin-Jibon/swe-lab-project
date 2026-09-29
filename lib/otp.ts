import { createHmac, randomInt, timingSafeEqual } from "node:crypto";
import type { DatabaseSync } from "node:sqlite";
import { JWT_SECRET } from "@/lib/auth";
import { isSmtpConfigured, sendPasswordResetEmail, sendOtpEmail } from "@/lib/mailer";

export const OTP_TTL_MINUTES = 10;
export const OTP_RESEND_COOLDOWN_SECONDS = 60;
export const OTP_MAX_ATTEMPTS = 5;

/** "verify" = email verification after sign-up, "reset" = forgot password. */
export type OtpPurpose = "verify" | "reset";

type OtpRow = {
  email: string;
  code: string;
  expires_at: string;
  attempts: number | null;
  last_sent_at: string | null;
};

/**
 * Row key in otp_codes. Verification codes keep the bare email (backwards
 * compatible); reset codes are namespaced so the two flows never collide.
 */
function otpKey(email: string, purpose: OtpPurpose): string {
  return purpose === "verify" ? email : `${purpose}:${email}`;
}

function hashOtp(key: string, code: string): string {
  return createHmac("sha256", JWT_SECRET).update(`${key}:${code}`).digest("hex");
}

function generateCode(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

export type IssueOtpResult =
  | { ok: true; devOtp?: string }
  | { ok: false; reason: "cooldown"; retryAfter: number }
  | { ok: false; reason: "send_failed" };

/**
 * Creates a fresh OTP for the email, stores only its hash, and emails it via SMTP.
 * Without SMTP config in development, the code is logged and returned as devOtp.
 */
export async function issueOtp(
  db: DatabaseSync,
  rawEmail: string,
  purpose: OtpPurpose = "verify"
): Promise<IssueOtpResult> {
  const email = rawEmail.toLowerCase();
  const key = otpKey(email, purpose);
  const existing = db
    .prepare("SELECT * FROM otp_codes WHERE email = ?")
    .get(key) as OtpRow | undefined;

  if (existing?.last_sent_at) {
    const elapsed = (Date.now() - new Date(existing.last_sent_at).getTime()) / 1000;
    if (elapsed < OTP_RESEND_COOLDOWN_SECONDS) {
      return {
        ok: false,
        reason: "cooldown",
        retryAfter: Math.ceil(OTP_RESEND_COOLDOWN_SECONDS - elapsed),
      };
    }
  }

  const code = generateCode();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + OTP_TTL_MINUTES * 60 * 1000);

  db.prepare(
    `INSERT INTO otp_codes (email, code, expires_at, attempts, last_sent_at)
     VALUES (?, ?, ?, 0, ?)
     ON CONFLICT(email) DO UPDATE SET
       code = excluded.code,
       expires_at = excluded.expires_at,
       attempts = 0,
       last_sent_at = excluded.last_sent_at`
  ).run(key, hashOtp(key, code), expiresAt.toISOString(), now.toISOString());

  if (!isSmtpConfigured()) {
    if (process.env.NODE_ENV === "production") {
      console.error("[otp] SMTP is not configured; cannot send OTP email.");
      return { ok: false, reason: "send_failed" };
    }
    console.info(`[otp] SMTP not configured — dev ${purpose} code for ${email}: ${code}`);
    return { ok: true, devOtp: code };
  }

  try {
    const user = db
      .prepare("SELECT full_name FROM users WHERE email = ?")
      .get(email) as { full_name: string | null } | undefined;
    const input = {
      email,
      code,
      name: user?.full_name,
      expiresInMinutes: OTP_TTL_MINUTES,
    };
    if (purpose === "reset") {
      await sendPasswordResetEmail(input);
    } else {
      await sendOtpEmail(input);
    }
    return { ok: true };
  } catch (error) {
    console.error(`[otp] Failed to send ${purpose} email:`, error);
    // Allow an immediate retry since the user never received this code.
    db.prepare("UPDATE otp_codes SET last_sent_at = NULL WHERE email = ?").run(key);
    return { ok: false, reason: "send_failed" };
  }
}

export type VerifyOtpResult =
  | { ok: true }
  | { ok: false; reason: "invalid" | "expired" | "too_many_attempts" };

/**
 * Checks a code. On success the code is consumed unless `consume` is false
 * (used to pre-validate a reset code before the new password is submitted).
 */
export function checkOtp(
  db: DatabaseSync,
  rawEmail: string,
  code: string,
  purpose: OtpPurpose = "verify",
  { consume = true }: { consume?: boolean } = {}
): VerifyOtpResult {
  const email = rawEmail.toLowerCase();
  const key = otpKey(email, purpose);
  const otp = db
    .prepare("SELECT * FROM otp_codes WHERE email = ?")
    .get(key) as OtpRow | undefined;

  if (!otp) return { ok: false, reason: "invalid" };

  if (new Date(otp.expires_at).getTime() < Date.now()) {
    return { ok: false, reason: "expired" };
  }

  if (Number(otp.attempts ?? 0) >= OTP_MAX_ATTEMPTS) {
    return { ok: false, reason: "too_many_attempts" };
  }

  const expected = Buffer.from(otp.code, "hex");
  const actual = Buffer.from(hashOtp(key, code), "hex");
  const matches =
    expected.length === actual.length && timingSafeEqual(expected, actual);

  if (!matches) {
    db.prepare("UPDATE otp_codes SET attempts = attempts + 1 WHERE email = ?").run(key);
    return { ok: false, reason: "invalid" };
  }

  if (consume) {
    db.prepare("DELETE FROM otp_codes WHERE email = ?").run(key);
  }
  return { ok: true };
}

export const OTP_ERROR_MESSAGES = {
  invalid: "Invalid code.",
  expired: "This code has expired. Please request a new one.",
  too_many_attempts: "Too many incorrect attempts. Please request a new code.",
} as const;
