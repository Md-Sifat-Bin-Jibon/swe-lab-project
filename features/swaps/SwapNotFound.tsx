"use client";

import Link from "next/link";

export interface SwapNotFoundProps {
  swapId?: string | null;
}

export function SwapNotFound({ swapId }: SwapNotFoundProps) {
  const message = swapId
    ? `We couldn't find a swap for "${swapId}".`
    : "No swap was selected.";

  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-100 bg-white px-6 py-16 text-center shadow-sm">
      <p className="text-lg font-semibold text-slate-900">Swap not found</p>
      <p className="mt-2 max-w-md text-sm text-slate-500">{message}</p>
      <Link
        href="/swaps"
        className="mt-6 inline-flex rounded-lg bg-swapspot-blue px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#3f52c4]"
      >
        Back to your swaps
      </Link>
    </div>
  );
}
