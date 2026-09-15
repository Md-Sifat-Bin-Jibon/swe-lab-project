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
import { login } from "@/services/api";
import { LoginHeader } from "./LoginHeader";

export function LoginForm() {
  const router = useRouter();
  const { showToast } = useToast();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!username.trim() || !password) {
      showToast("Please enter your username and password.");
      return;
    }

    setSubmitting(true);

    try {
      const { user } = await login({
        email: username.trim(),
        password,
      });

      if (user.onboardingComplete) {
        router.push("/dashboard");
      } else {
        router.push("/onboarding/1");
      }
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Login failed.");
      setSubmitting(false);
    }
  }

  return (
    <div
      className="flex min-h-screen w-full flex-col md:flex-row"
      role="region"
      aria-label="Login"
    >
      <AuthIllustration className="hidden md:flex md:w-1/2" />
      <div className="flex w-full flex-1 flex-col justify-center px-6 py-10 sm:px-10 md:w-1/2 md:px-14 lg:px-20">
        <div className="mx-auto w-full max-w-md">
          <LoginHeader />

          <form className="mt-8 space-y-5" onSubmit={handleSubmit} noValidate>
            <FormField
              id="username"
              label="Username"
              type="text"
              placeholder="Enter your username"
              autocomplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />

            <PasswordField
              id="password"
              label="Password"
              placeholder="Enter your password"
              autocomplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <div className="text-right">
              <a
                href="#"
                className="text-sm font-medium text-swapspot-blue transition hover:underline"
              >
                Forgot Password?
              </a>
            </div>

            <Button
              label={submitting ? "Logging in…" : "Login"}
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
            Don&apos;t have an account?{" "}
            <Link
              href="/signup"
              className="font-semibold text-swapspot-blue hover:underline"
            >
              Register Now
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
