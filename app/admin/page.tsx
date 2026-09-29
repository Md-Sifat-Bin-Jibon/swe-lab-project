"use client";

import { Suspense, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { adminApi } from "@/services/adminApi";

function AdminLogin() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await adminApi.login(email.trim(), password);
      const next = params.get("next");
      router.replace(next && next.startsWith("/admin/") ? next : "/admin/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign-in failed.");
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-900 px-4">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-swapspot-blue text-lg font-bold text-white">S</span>
          <h1 className="mt-4 text-2xl font-bold text-white">SwapSpot Admin</h1>
          <p className="mt-1 text-sm text-slate-400">Sign in to manage the platform.</p>
        </div>

        <form onSubmit={submit} noValidate className="space-y-4 rounded-2xl bg-white p-6 shadow-xl">
          <div>
            <label htmlFor="admin-email" className="mb-1.5 block text-sm font-medium text-slate-600">
              Email
            </label>
            <input
              id="admin-email"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-4 py-2.5 focus:border-swapspot-blue focus:outline-none focus:ring-2 focus:ring-swapspot-blue/20"
              placeholder="admin@swapspot.test"
            />
          </div>
          <div>
            <label htmlFor="admin-password" className="mb-1.5 block text-sm font-medium text-slate-600">
              Password
            </label>
            <input
              id="admin-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-4 py-2.5 focus:border-swapspot-blue focus:outline-none focus:ring-2 focus:ring-swapspot-blue/20"
              placeholder="••••••••"
            />
          </div>

          {error ? (
            <p className="rounded-lg bg-rose-50 px-4 py-2.5 text-sm text-rose-700" role="alert">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-lg bg-swapspot-blue px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#3f52c4] disabled:opacity-70"
          >
            {busy ? "Signing in…" : "Sign in"}
          </button>
          <p className="text-center text-xs text-slate-400">Admin access only. Actions are recorded in the audit log.</p>
        </form>
      </div>
    </main>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-slate-900" />}>
      <AdminLogin />
    </Suspense>
  );
}
