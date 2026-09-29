"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { OtpInput } from "@/components/ui/OtpInput";
import { PasswordField } from "@/components/ui/PasswordField";
import { useToast } from "@/hooks/useToast";
import { forgotPassword, resetPassword } from "@/services/api";
import { AuthPageShell } from "./AuthPageShell";

const OTP_LENGTH = 6;
const RESEND_SECONDS = 60;

function passwordChecks(password: string) {
  return [
    { label: "At least 8 characters", ok: password.length >= 8 },
    { label: "A number", ok: /\d/.test(password) },
    { label: "An uppercase & lowercase letter", ok: /[a-z]/.test(password) && /[A-Z]/.test(password) },
  ];
}

export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();

  const [email, setEmail] = useState(searchParams.get("email") || "");
  const [step, setStep] = useState<"code" | "password">("code");
  const [digits, setDigits] = useState<string[]>(() => Array(OTP_LENGTH).fill(""));
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const code = digits.join("");

  useEffect(() => {
    if (email) return;
    try {
      setEmail(sessionStorage.getItem("swapspotResetEmail") || "");
    } catch {
      /* ignore */
    }
  }, [email]);

  const startTimer = useCallback(() => {
    if (timer.current) clearInterval(timer.current);
    setSecondsLeft(RESEND_SECONDS);
    timer.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          if (timer.current) clearInterval(timer.current);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  }, []);

  useEffect(() => {
    startTimer();
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [startTimer]);

  async function handleVerifyCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!email) {
      showToast("Missing email. Please start again.");
      router.push("/forgot-password");
      return;
    }
    if (code.length < OTP_LENGTH) {
      showToast("Please enter the 6-digit code.");
      return;
    }

    setSubmitting(true);
    try {
      await resetPassword({ email, code });
      setStep("password");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Invalid code.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResetPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (password.length < 8) {
      showToast("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      showToast("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    try {
      const result = await resetPassword({ email, code, password });
      try {
        sessionStorage.removeItem("swapspotResetEmail");
      } catch {
        /* ignore */
      }
      showToast(result.message || "Password reset. Please log in.");
      router.push("/login");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Could not reset password.");
      // Code expired or locked out while choosing a password → back to step 1.
      setStep("code");
      setDigits(Array(OTP_LENGTH).fill(""));
      setSubmitting(false);
    }
  }

  async function handleResend() {
    if (!email) {
      router.push("/forgot-password");
      return;
    }
    setResending(true);
    try {
      const result = await forgotPassword({ email });
      setDigits(Array(OTP_LENGTH).fill(""));
      startTimer();
      showToast(
        result.devOtp
          ? `Dev mode (no SMTP): your reset code is ${result.devOtp}`
          : `A new code has been sent to ${email}.`
      );
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Could not resend the code.");
    } finally {
      setResending(false);
    }
  }

  if (step === "password") {
    const checks = passwordChecks(password);
    return (
      <AuthPageShell
        label="Choose a new password"
        title="Choose a new password"
        subtitle={
          <>
            For <span className="font-medium text-slate-700">{email}</span>
          </>
        }
      >
        <form className="mt-8 space-y-5" onSubmit={handleResetPassword} noValidate>
          <PasswordField
            id="new-password"
            label="New password"
            placeholder="Enter a new password"
            autocomplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <ul className="space-y-1 text-sm" aria-live="polite">
            {checks.map((c) => (
              <li key={c.label} className={c.ok ? "text-emerald-600" : "text-slate-400"}>
                {c.ok ? "✓" : "○"} {c.label}
              </li>
            ))}
          </ul>
          <PasswordField
            id="confirm-new-password"
            label="Confirm new password"
            placeholder="Re-enter the new password"
            autocomplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
          {confirm && confirm !== password ? (
            <p className="text-sm text-rose-500">Passwords do not match.</p>
          ) : null}

          <Button
            label={submitting ? "Saving…" : "Reset password"}
            variant="primary"
            as="submit"
            disabled={submitting}
          />
        </form>
      </AuthPageShell>
    );
  }

  return (
    <AuthPageShell
      label="Enter reset code"
      title="Check your email"
      subtitle={
        <>
          Enter the 6-digit code we sent to{" "}
          <span className="font-medium text-slate-700">{email || "your email"}</span>
        </>
      }
    >
      <form className="mt-8 space-y-6" onSubmit={handleVerifyCode} noValidate>
        <OtpInput value={digits} onChange={setDigits} autoFocus disabled={submitting} />

        <div className="text-center text-sm text-slate-500">
          Didn&apos;t get it?{" "}
          <button
            type="button"
            onClick={handleResend}
            disabled={resending || secondsLeft > 0}
            className="font-semibold text-swapspot-blue hover:underline disabled:cursor-not-allowed disabled:text-slate-400 disabled:no-underline"
          >
            {resending
              ? "Sending…"
              : secondsLeft > 0
                ? `Resend in ${secondsLeft}s`
                : "Resend code"}
          </button>
        </div>

        <Button
          label={submitting ? "Checking…" : "Continue"}
          variant="primary"
          as="submit"
          disabled={submitting}
        />
      </form>

      <p className="mt-6 text-center text-sm text-slate-600">
        Wrong email?{" "}
        <Link href="/forgot-password" className="font-semibold text-swapspot-blue hover:underline">
          Start over
        </Link>
        {" · "}
        <Link href="/login" className="font-semibold text-swapspot-blue hover:underline">
          Back to login
        </Link>
      </p>
    </AuthPageShell>
  );
}
