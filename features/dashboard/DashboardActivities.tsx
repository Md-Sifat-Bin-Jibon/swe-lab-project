"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import type { Activity } from "@/types";

export interface DashboardActivitiesProps {
  activities: Activity[];
}

/** "just now", "5m ago", "3h ago", "yesterday", "Sep 12". */
export function relativeTime(iso: string, now = Date.now()): string {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "";
  const s = Math.max(0, Math.round((now - t) / 1000));
  if (s < 45) return "just now";
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  if (d === 1) return "yesterday";
  if (d < 7) return `${d}d ago`;
  return new Date(t).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

const ICONS: Record<Activity["icon"], { bg: string; path: ReactNode }> = {
  proposal: { bg: "bg-swapspot-blue/10 text-swapspot-blue", path: <path d="M4 12h16M14 6l6 6-6 6" /> },
  counter: { bg: "bg-amber-50 text-amber-600", path: <path d="M7 7h11l-3-3M17 17H6l3 3" /> },
  accepted: { bg: "bg-emerald-50 text-emerald-600", path: <path d="m5 12 5 5L20 7" /> },
  declined: { bg: "bg-slate-100 text-slate-500", path: <path d="M6 6l12 12M18 6 6 18" /> },
  completed: {
    bg: "bg-emerald-50 text-emerald-600",
    path: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="m8 12 3 3 5-6" />
      </>
    ),
  },
  dispute: { bg: "bg-rose-50 text-rose-600", path: <path d="M12 8v5m0 3h.01M10.3 3.9 2 18a2 2 0 0 0 1.7 3h16.6a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" /> },
  review: { bg: "bg-amber-50 text-amber-500", path: <path d="M12 3l2.6 5.6 6 .7-4.5 4.1 1.2 6L12 16.5 6.7 19.4l1.2-6L3.4 9.3l6-.7L12 3Z" /> },
  wallet: { bg: "bg-violet-50 text-violet-600", path: <path d="M3 7h18v12H3zM16 13h.01M3 7l3-4h12l3 4" /> },
  meeting: { bg: "bg-swapspot-blue/10 text-swapspot-blue", path: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M8 3v4m8-4v4M3 11h18" /></> },
  verified: { bg: "bg-emerald-50 text-emerald-600", path: <path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6l-8-3Zm-3 9 2 2 4-4" /> },
};

export function DashboardActivities({ activities }: DashboardActivitiesProps) {
  // Re-render relative times every minute.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(t);
  }, []);

  return (
    <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm" aria-labelledby="activities-heading">
      <h2 id="activities-heading" className="mb-2 text-xl font-bold text-slate-900">
        Recent Activities
      </h2>

      {activities.length === 0 ? (
        <div className="py-8 text-center">
          <p className="text-sm font-medium text-slate-700">No activity yet</p>
          <p className="mt-1 text-sm text-slate-400">
            Proposals, accepted swaps, reviews and wallet top-ups will show up here.
          </p>
          <Link href="/browse" className="mt-4 inline-block text-sm font-semibold text-swapspot-blue hover:underline">
            Find someone to swap with →
          </Link>
        </div>
      ) : (
        <ul className="divide-y divide-slate-100">
          {activities.map((item) => {
            const icon = ICONS[item.icon] ?? ICONS.proposal;
            const body = (
              <>
                <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${icon.bg}`}>
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    {icon.path}
                  </svg>
                </span>
                <p className="min-w-0 flex-1 text-sm leading-relaxed text-slate-600">
                  <strong className="font-semibold text-slate-900">{item.subject}</strong> {item.text}
                </p>
                <time dateTime={item.at} title={new Date(item.at).toLocaleString()} className="shrink-0 text-xs text-slate-400">
                  {relativeTime(item.at, now)}
                </time>
              </>
            );
            return (
              <li key={item.id}>
                {item.href ? (
                  <Link href={item.href} className="-mx-2 flex items-start gap-3 rounded-lg px-2 py-3.5 transition hover:bg-slate-50">
                    {body}
                  </Link>
                ) : (
                  <div className="flex items-start gap-3 py-3.5">{body}</div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
