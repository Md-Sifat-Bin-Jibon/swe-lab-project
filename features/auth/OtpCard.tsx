"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ClipboardEvent,
  type KeyboardEvent,
} from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/hooks/useToast";
import { resendOtp, verifyOtp } from "@/services/api";

const TIMER_SECONDS = 59;
const OTP_LENGTH = 6;

function formatTime(seconds: number) {
  const mins = String(Math.floor(seconds / 60)).padStart(2, "0");
  const secs = String(seconds % 60).padStart(2, "0");
  return `${mins}:${secs}`;
}

function StopwatchIcon() {
  return (
    <svg
      className="h-4 w-4 text-swapspot-blue"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <circle cx="12" cy="13" r="8" />
      <path
        d="M12 9v4l2 2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M9 3h6" strokeLinecap="round" />
    </svg>
  );
}

export function OtpCard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();

  const emailParam = searchParams.get("email") || "";
  const [email, setEmail] = useState(emailParam);
  const [digits, setDigits] = useState<string[]>(
    () => Array(OTP_LENGTH).fill("")
  );
  const [secondsLeft, setSecondsLeft] = useState(TIMER_SECONDS);
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const timerId = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (emailParam) {
      setEmail(emailParam);
      return;
    }
    const stored =
      typeof window !== "undefined"
        ? sessionStorage.getItem("swapspotEmail") || ""
        : "";
    setEmail(stored);
  }, [emailParam]);

  const startTimer = useCallback(() => {
    if (timerId.current) clearInterval(timerId.current);
    setSecondsLeft(TIMER_SECONDS);

    timerId.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          if (timerId.current) clearInterval(timerId.current);
          timerId.current = null;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  useEffect(() => {
    startTimer();
    inputRefs.current[0]?.focus();
    return () => {
      if (timerId.current) clearInterval(timerId.current);
    };
  }, [startTimer]);

  function updateDigit(index: number, value: string) {
    const cleaned = value.replace(/\D/g, "").slice(0, 1);
    setDigits((prev) => {
      const next = [...prev];
      next[index] = cleaned;
      return next;
    });
    if (cleaned && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handleKeyDown(
    index: number,
    event: KeyboardEvent<HTMLInputElement>
  ) {
    if (event.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  function handlePaste(event: ClipboardEvent<HTMLInputElement>) {
    event.preventDefault();
    const pasted = event.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, OTP_LENGTH);

    if (!pasted) return;

    const next = Array(OTP_LENGTH).fill("");
    pasted.split("").forEach((digit, i) => {
      next[i] = digit;
    });
    setDigits(next);
    const nextIndex = Math.min(pasted.length, OTP_LENGTH - 1);
    inputRefs.current[nextIndex]?.focus();
  }

  async function handleResend() {
    if (!email) {
      showToast("Missing email. Please register again.");
      router.push("/signup");
      return;
    }

    setResending(true);
    try {
      const result = await resendOtp({ email });
      setDigits(Array(OTP_LENGTH).fill(""));
      inputRefs.current[0]?.focus();
      startTimer();
      showToast(
        result.devOtp
          ? `Dev mode (no SMTP): your code is ${result.devOtp}`
          : `A new code has been sent to ${email}.`
      );
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "Could not resend the code."
      );
    } finally {
      setResending(false);
    }
  }

  async function handleContinue() {
    const code = digits.join("");

    if (code.length < OTP_LENGTH) {
      showToast("Please enter the 6-digit code.");
      return;
    }

    if (!email) {
      showToast("Missing email. Please register again.");
      router.push("/signup");
      return;
    }

    setSubmitting(true);

    try {
      await verifyOtp({ email, code });
      router.push("/onboarding/1");
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "OTP verification failed."
      );
      setSubmitting(false);
    }
  }

  return (
    <article
      className="relative w-full max-w-3xl rounded-2xl bg-white px-6 py-12 shadow-sm sm:px-12 sm:py-16"
      aria-labelledby="otp-heading"
    >
      <div className="relative w-full">
        <Link
          href="/signup"
          className="absolute left-0 top-0 inline-flex h-10 w-10 items-center justify-center rounded-full text-2xl font-light text-slate-800 transition hover:bg-slate-100"
          aria-label="Go back"
        >
          &lsaquo;
        </Link>

        <div className="mx-auto max-w-md pt-2 text-center">
          <h1
            id="otp-heading"
            className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl"
          >
            OTP Code Sent
          </h1>
          <p className="mt-4 text-base text-slate-500">
            Enter the 6-digit that we have sent to{" "}
            <span className="font-medium text-slate-700">
              {email || "your email"}
            </span>
          </p>
        </div>
      </div>

      <div className="mx-auto mt-10 max-w-lg space-y-6">
        <div className="flex justify-center gap-2 sm:gap-3">
          {digits.map((digit, index) => (
            <input
              key={index}
              ref={(el) => {
                inputRefs.current[index] = el;
              }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              pattern="[0-9]"
              value={digit}
              onChange={(e) => updateDigit(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={handlePaste}
              className="h-14 w-12 rounded-xl border border-slate-200 bg-white text-center text-xl font-semibold text-slate-900 focus:border-swapspot-blue focus:outline-none focus:ring-2 focus:ring-swapspot-blue/20 sm:h-16 sm:w-14"
              aria-label={`Digit ${index + 1}`}
            />
          ))}
        </div>

        <div className="flex justify-start pl-1">
          <div className="flex items-center gap-2 text-sm font-semibold text-swapspot-blue">
            <StopwatchIcon />
            <span>{formatTime(secondsLeft)}</span>
          </div>
        </div>

        <div className="text-center">
          <button
            type="button"
            className="text-sm font-semibold text-swapspot-blue transition hover:underline disabled:cursor-not-allowed disabled:opacity-50 disabled:no-underline"
            onClick={handleResend}
            disabled={resending || secondsLeft > 0}
          >
            {resending
              ? "Sending…"
              : secondsLeft > 0
                ? `Resend Code in ${secondsLeft}s`
                : "Resend Code"}
          </button>
        </div>

        <button
          type="button"
          className="w-full rounded-xl bg-swapspot-blue px-6 py-3.5 text-base font-semibold text-white transition hover:bg-[#3f52c4] disabled:opacity-60"
          onClick={handleContinue}
          disabled={submitting}
        >
          {submitting ? "Verifying…" : "Continue"}
        </button>
      </div>
    </article>
  );
}
