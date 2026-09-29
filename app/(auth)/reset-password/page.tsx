"use client";

import { Suspense } from "react";
import { ResetPasswordForm } from "@/features/auth/ResetPasswordForm";

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center text-slate-500">Loading…</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
