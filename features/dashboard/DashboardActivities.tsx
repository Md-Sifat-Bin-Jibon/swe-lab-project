"use client";

import type { Activity } from "@/types";

export interface DashboardActivitiesProps {
  activities: Activity[];
}

export function DashboardActivities({ activities }: DashboardActivitiesProps) {
  return (
    <section
      className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm"
      aria-labelledby="activities-heading"
    >
      <h2
        id="activities-heading"
        className="mb-2 text-xl font-bold text-slate-900"
      >
        Recent Activities
      </h2>
      <ul className="divide-y divide-slate-100">
        {activities.map((item, index) => (
          <li
            key={`${item.order}-${index}`}
            className="flex items-start justify-between gap-4 border-b border-slate-100 py-4 last:border-0"
          >
            <p className="text-sm text-slate-700">{item.text}</p>
            <span className="shrink-0 text-sm text-slate-400">
              {item.time ?? ""}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
