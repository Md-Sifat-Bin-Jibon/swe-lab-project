"use client";

import Link from "next/link";
import { useState } from "react";
import type { MatchProfile } from "@/types";
import { useSwapActions } from "@/features/swaps/SwapActionsProvider";
import { Avatar } from "@/components/ui/Avatar";

const verifiedBadge = (
  <svg
    className="h-4 w-4 text-swapspot-blue"
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
  >
    <path d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
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

export function MatchCard({
  id,
  name,
  location,
  rating,
  avatar,
  available,
  offer,
  want,
  idVerified,
}: MatchProfile) {
  const { goToChat, propose } = useSwapActions();
  const [busy, setBusy] = useState(false);
  const statusClass = available ? "text-emerald-600" : "text-slate-400";
  const statusText = available ? "Available" : "Not available";

  return (
    <article className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="flex gap-3">
          <Avatar src={avatar} name={name} size={48} className="rounded-full" />
          <div>
            <div className="flex items-center gap-1">
              <h3 className="font-semibold text-slate-900">{name}</h3>
              {idVerified ? (
                <span title="ID verified" aria-label="ID verified">
                  {verifiedBadge}
                </span>
              ) : null}
            </div>
            <p className="text-sm text-slate-500">{location}</p>
            <div className="mt-1 flex items-center gap-1 text-sm text-slate-600">
              {starIcon}
              <span className="font-medium">{rating}</span>
            </div>
          </div>
        </div>
        <span className={`shrink-0 text-xs font-semibold ${statusClass}`}>
          {statusText}
        </span>
      </div>

      <div className="mt-5 space-y-3">
        <div>
          <p className="text-xs font-medium text-slate-500">I offer</p>
          <span className="mt-1 inline-block rounded-lg bg-swapspot-blue/10 px-3 py-1 text-sm font-medium text-swapspot-blue">
            {offer}
          </span>
        </div>
        <div>
          <p className="text-xs font-medium text-slate-500">In exchange for</p>
          <span className="mt-1 inline-block rounded-lg bg-swapspot-blue/10 px-3 py-1 text-sm font-medium text-swapspot-blue">
            {want}
          </span>
        </div>
      </div>

      <div className="mt-5 flex items-center gap-2">
        <Link
          href={id ? `/profiles/${encodeURIComponent(id)}` : "/browse"}
          className="flex-1 rounded-lg border-2 border-swapspot-blue py-2 text-center text-sm font-semibold text-swapspot-blue transition hover:bg-swapspot-blue/5"
        >
          View Profile
        </Link>
        <button
          type="button"
          onClick={() => goToChat(id)}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-swapspot-blue text-white transition hover:bg-[#3f52c4]"
          aria-label={`Chat with ${name}`}
        >
          <svg
            className="h-5 w-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
          </svg>
        </button>
        <button
          type="button"
          disabled={busy || !available}
          onClick={async () => {
            setBusy(true);
            await propose({ id, name, offer, want });
            setBusy(false);
          }}
          className="flex-1 rounded-lg bg-swapspot-blue py-2 text-sm font-semibold text-white transition hover:bg-[#3f52c4] disabled:opacity-70"
        >
          {busy ? "Opening…" : "Swap"}
        </button>
      </div>
    </article>
  );
}
