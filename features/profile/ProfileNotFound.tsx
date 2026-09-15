"use client";

import Link from "next/link";

export interface ProfileNotFoundProps {
  profileId?: string | null;
}

export function ProfileNotFound({ profileId }: ProfileNotFoundProps) {
  const message = profileId
    ? `We couldn't find a profile for "${profileId}".`
    : "No profile was selected.";

  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-100 bg-white px-6 py-16 text-center shadow-sm">
      <p className="text-lg font-semibold text-slate-900">Profile not found</p>
      <p className="mt-2 max-w-md text-sm text-slate-500">{message}</p>
      <Link
        href="/browse"
        className="mt-6 inline-flex rounded-lg bg-swapspot-blue px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#3f52c4]"
      >
        Browse members
      </Link>
    </div>
  );
}
