import Link from "next/link";
import type { LandingProfile } from "./landingProfiles";

const pinIcon = (
  <svg
    className="h-3.5 w-3.5 shrink-0 text-slate-400"
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
  >
    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5A2.5 2.5 0 1 1 12 6a2.5 2.5 0 0 1 0 5.5z" />
  </svg>
);

const starIcon = (
  <svg
    className="h-3.5 w-3.5 text-amber-400"
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
  >
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2Z" />
  </svg>
);

export function LandingProfileCard({
  name,
  location,
  rating,
  avatar,
  available,
  offer,
  want,
}: LandingProfile) {
  return (
    <article className="rounded-xl border border-slate-100 bg-white p-5 shadow-[0_1px_3px_rgba(15,23,42,0.06)]">
      <div className="flex items-start gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={avatar}
          alt=""
          className="h-12 w-12 shrink-0 rounded-full object-cover"
          width={48}
          height={48}
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                <h3 className="truncate text-base font-semibold text-slate-900">
                  {name}
                </h3>
                <span className="inline-flex items-center gap-0.5 text-sm text-slate-600">
                  {starIcon}
                  <span className="font-medium">{rating}/5</span>
                </span>
              </div>
              <p className="mt-0.5 flex items-center gap-1 text-sm text-slate-500">
                {pinIcon}
                <span className="truncate">{location}</span>
              </p>
            </div>
            <span
              className={`shrink-0 rounded-md px-2 py-0.5 text-xs font-semibold ${
                available
                  ? "bg-emerald-50 text-emerald-600"
                  : "bg-rose-50 text-rose-500"
              }`}
            >
              {available ? "Available" : "Busy"}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-5 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-slate-500">I offer</span>
          <span className="rounded-md bg-[#e8f0fe] px-2.5 py-1 text-sm font-medium text-[#3b6fd9]">
            {offer}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-slate-500">In exchange for</span>
          <span className="rounded-md bg-[#efe8fd] px-2.5 py-1 text-sm font-medium text-[#7c5cbf]">
            {want}
          </span>
        </div>
      </div>

      <div className="mt-5 flex items-center gap-2">
        <Link
          href="/signup"
          className="flex-1 rounded-md border border-swapspot-blue py-2 text-center text-sm font-semibold text-swapspot-blue transition hover:bg-swapspot-blue/5"
        >
          View Profile
        </Link>
        <Link
          href="/login"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-swapspot-blue text-white transition hover:bg-[#3f52c4]"
          aria-label={`Message ${name}`}
        >
          <svg
            className="h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
          </svg>
        </Link>
        <Link
          href="/signup"
          className="flex-1 rounded-md bg-swapspot-blue py-2 text-center text-sm font-semibold text-white transition hover:bg-[#3f52c4]"
        >
          Swap
        </Link>
      </div>
    </article>
  );
}
