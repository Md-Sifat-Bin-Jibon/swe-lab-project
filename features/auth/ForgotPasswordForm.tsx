"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { useToast } from "@/hooks/useToast";
import { forgotPassword } from "@/services/api";
import { AuthPageShell } from "./AuthPageShell";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function ForgotPasswordForm() {
  const router = useRouter();
  const { showToast } = useToast();
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = email.trim().toLowerCase();

    if (!EMAIL_RE.test(trimmed)) {
      showToast("Please enter a valid email address.");
      return;
    }

    setSubmitting(true);
    try {
      const result = await forgotPassword({ email: trimmed });
      showToast(
        result.devOtp
          ? `Dev mode (no SMTP): your reset code is ${result.devOtp}`
          : result.message
      );
      sessionStorage.setItem("swapspotResetEmail", trimmed);
      router.push(`/reset-password?email=${encodeURIComponent(trimmed)}`);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Something went wrong.");
      setSubmitting(false);
    }
  }

  return (
    <AuthPageShell
      label="Forgot password"
      title="Forgot your password?"
      subtitle="Enter the email you signed up with and we'll send you a code to reset it."
    >
      <form className="mt-8 space-y-5" onSubmit={handleSubmit} noValidate>
        <FormField
          id="email"
          label="Email"
          type="email"
          placeholder="you@example.com"
          autocomplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <Button
          label={submitting ? "Sending code…" : "Send reset code"}
          variant="primary"
          as="submit"
          disabled={submitting}
        />
      </form>

      <p className="mt-6 text-center text-sm text-slate-600">
        Remembered it?{" "}
        <Link href="/login" className="font-semibold text-swapspot-blue hover:underline">
          Back to login
        </Link>
      </p>
    </AuthPageShell>
  );
}
