"use client";

import { Suspense } from "react";
import { OtpCard } from "@/features/auth/OtpCard";

function OtpFallback() {
  return (
    <div className="w-full max-w-3xl rounded-2xl bg-white px-6 py-12 text-center text-slate-500 shadow-sm sm:px-12 sm:py-16">
      Loading…
    </div>
  );
}

export default function OtpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-8">
      <Suspense fallback={<OtpFallback />}>
        <OtpCard />
      </Suspense>
    </div>
  );
}
