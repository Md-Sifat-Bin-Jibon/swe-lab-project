"use client";

import Link from "next/link";
import { useState } from "react";
import type { MatchProfile } from "@/types";
import { useSwapActions } from "@/features/swaps/SwapActionsProvider";

const verifiedBadge = (
  <svg
    className="h-5 w-5 text-swapspot-blue"
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
  >
    <path d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
  </svg>
);

const starIcon = (
  <svg
    className="h-4 w-4 text-amber-400"
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
  >
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2Z" />
  </svg>
);

export function ProfileDetail({ profile }: { profile: MatchProfile }) {
  const { goToChat, propose } = useSwapActions();
  const [busy, setBusy] = useState(false);
  const statusClass = profile.available ? "text-emerald-600" : "text-slate-400";
  const statusText = profile.available
    ? "Available for swaps"
    : "Not available";

  return (
    <div className="space-y-6">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-swapspot-blue"
      >
        <svg
          className="h-4 w-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
        >
          <path
            d="m15 18-6-6 6-6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        Back to dashboard
      </Link>

      <article className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
        <div className="bg-gradient-to-r from-swapspot-blue/10 via-swapspot-blue/5 to-transparent px-6 py-8 sm:px-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={profile.avatar}
              alt={profile.name}
              className="h-28 w-28 rounded-2xl object-cover shadow-md ring-4 ring-white"
              width={112}
              height={112}
            />
            <div className="min-w-0 flex-1 pb-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-3xl font-bold text-slate-900">
                  {profile.name}
                </h1>
                {verifiedBadge}
              </div>
              <p className="mt-1 text-slate-500">{profile.location}</p>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-1 text-sm text-slate-600">
                  {starIcon}
                  <span className="font-semibold">{profile.rating}</span>
                </div>
                <span className={`text-sm font-semibold ${statusClass}`}>
                  {statusText}
                </span>
              </div>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2 sm:pb-1">
              <button
                type="button"
                onClick={() => goToChat(profile.id)}
                className="inline-flex items-center justify-center gap-2 rounded-lg border-2 border-swapspot-blue px-5 py-2.5 text-sm font-semibold text-swapspot-blue transition hover:bg-swapspot-blue/5"
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
                Chat
              </button>
              <button
                type="button"
                disabled={!profile.available || busy}
                onClick={async () => {
                  setBusy(true);
                  await propose({
                    id: profile.id,
                    name: profile.name,
                    offer: profile.offer,
                    want: profile.want,
                  });
                  setBusy(false);
                }}
                className="rounded-lg bg-swapspot-blue px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#3f52c4] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {busy ? "Opening…" : "Propose Swap"}
              </button>
            </div>
          </div>
        </div>

        <div className="grid gap-6 p-6 sm:grid-cols-3 sm:p-8">
          <div className="rounded-xl bg-slate-50 p-4 text-center">
            <p className="text-2xl font-bold text-slate-900">
              {profile.completedSwaps}
            </p>
            <p className="mt-1 text-sm text-slate-500">Completed swaps</p>
          </div>
          <div className="rounded-xl bg-slate-50 p-4 text-center">
            <p className="text-2xl font-bold text-slate-900">
              {profile.memberSince}
            </p>
            <p className="mt-1 text-sm text-slate-500">Member since</p>
          </div>
          <div className="rounded-xl bg-slate-50 p-4 text-center">
            <p className="text-2xl font-bold text-slate-900">
              {profile.skills.length}
            </p>
            <p className="mt-1 text-sm text-slate-500">Listed skills</p>
          </div>
        </div>
      </article>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">About</h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-600">
            {profile.bio}
          </p>
        </section>

        <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">Skills</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {profile.skills.map((skill) => (
              <span
                key={skill}
                className="inline-block rounded-lg bg-swapspot-blue/10 px-3 py-1.5 text-sm font-medium text-swapspot-blue"
              >
                {skill}
              </span>
            ))}
          </div>
        </section>
      </div>

      <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900">Swap preferences</h2>
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Offers
            </p>
            <span className="mt-2 inline-block rounded-lg bg-swapspot-blue/10 px-3 py-1.5 text-sm font-medium text-swapspot-blue">
              {profile.offer}
            </span>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Wants in exchange
            </p>
            <span className="mt-2 inline-block rounded-lg bg-swapspot-blue/10 px-3 py-1.5 text-sm font-medium text-swapspot-blue">
              {profile.want}
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}
