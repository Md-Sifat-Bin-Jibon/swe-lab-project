"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthIllustration } from "@/components/layout/AuthIllustration";
import { Button } from "@/components/ui/Button";
import { Divider } from "@/components/ui/Divider";
import { FormField } from "@/components/ui/FormField";
import { PasswordField } from "@/components/ui/PasswordField";
import { SocialButton } from "@/components/ui/SocialButton";
import { useToast } from "@/hooks/useToast";
import { register } from "@/services/api";
import { RegisterHeader } from "./RegisterHeader";

export function RegisterForm() {
  const router = useRouter();
  const { showToast } = useToast();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedUsername = username.trim();
    const trimmedEmail = email.trim();

    if (!trimmedUsername || !trimmedEmail || !password) {
      showToast("Please fill in all fields.");
      return;
    }

    if (password !== confirmPassword) {
      showToast("Passwords do not match.");
      return;
    }

    setSubmitting(true);

    try {
      await register({
        email: trimmedEmail,
        password,
        username: trimmedUsername,
      });
      sessionStorage.setItem("swapspotEmail", trimmedEmail);
      router.push(`/otp?email=${encodeURIComponent(trimmedEmail)}`);
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "Registration failed."
      );
      setSubmitting(false);
    }
  }

  return (
    <div
      className="flex min-h-screen w-full flex-col md:flex-row"
      role="region"
      aria-label="Sign up"
    >
      <AuthIllustration className="hidden md:flex md:w-1/2" />
      <div className="flex w-full flex-1 flex-col justify-center px-6 py-10 sm:px-10 md:w-1/2 md:px-14 lg:px-20">
        <div className="mx-auto w-full max-w-md">
          <RegisterHeader />

          <form className="mt-8 space-y-5" onSubmit={handleSubmit} noValidate>
            <FormField
              id="username"
              label="Username"
              type="text"
              placeholder="yourusername"
              autocomplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />

            <FormField
              id="email"
              label="Email"
              type="email"
              placeholder="email@example.com"
              autocomplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <PasswordField
              id="password"
              label="Password"
              placeholder="Enter your password"
              autocomplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <PasswordField
              id="confirm-password"
              label="Confirm Password"
              placeholder="Confirm your password"
              autocomplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />

            <Button
              label={submitting ? "Registering…" : "Register"}
              variant="primary"
              as="submit"
              disabled={submitting}
            />

            <Divider />

            <div className="space-y-3">
              <SocialButton provider="google" />
              <SocialButton provider="facebook" />
            </div>
          </form>

          <p className="mt-6 text-center text-sm text-slate-600">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-semibold text-swapspot-blue hover:underline"
            >
              Sign in
            </Link>
          </p>

          <p className="mt-8 text-center text-xs leading-relaxed text-slate-400">
            By signing up or logging in, I accept the app&apos;s{" "}
            <a href="#" className="text-swapspot-blue hover:underline">
              Terms of Service
            </a>{" "}
            and{" "}
            <a href="#" className="text-swapspot-blue hover:underline">
              Privacy Policy
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
