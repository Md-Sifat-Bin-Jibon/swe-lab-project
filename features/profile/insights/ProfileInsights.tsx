"use client";

import { useEffect, useState } from "react";
import { fetchProfileStats } from "@/services/api";
import type { ProfileStats } from "@/types";
import {
  BarList,
  ChartCard,
  ColumnChart,
  RingMeter,
  SERIES,
  StackedBar,
} from "./charts";

function formatMemberSince(value: string | null): string {
  if (!value) return "—";
  const d = new Date(value.includes(" ") && /^\d{4}-/.test(value) ? value.replace(" ", "T") + "Z" : value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

function StatTile({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-bold tabular-nums text-slate-900">{value}</p>
      {hint ? <p className="mt-1 text-xs text-slate-400">{hint}</p> : null}
    </div>
  );
}

function Skeleton() {
  return (
    <div className="grid gap-6 lg:grid-cols-2" aria-busy="true">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-64 animate-pulse rounded-2xl bg-slate-100" />
      ))}
    </div>
  );
}

export function ProfileInsights({ refreshKey = 0 }: { refreshKey?: number }) {
  const [stats, setStats] = useState<ProfileStats | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchProfileStats()
      .then((s) => !cancelled && setStats(s))
      .catch(() => !cancelled && setError(true));
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  if (error) {
    return <p className="text-sm text-rose-600">Could not load your insights.</p>;
  }
  if (!stats) return <Skeleton />;
  return <ProfileInsightsView stats={stats} />;
}

export function ProfileInsightsView({ stats }: { stats: ProfileStats }) {
  const { kpis, completeness, activity, messages, status, demand, ratings } = stats;
  const statusColors: Record<string, string> = {
    active: SERIES[0],
    pending: SERIES[1],
    completed: SERIES[2],
    dispute: SERIES[3],
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Your insights</h2>
        <p className="mt-1 text-sm text-slate-500">
          Charts marked <span className="font-medium">Sample data</span> show example numbers until you have
          activity of your own.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile label="Completed swaps" value={String(kpis.completedSwaps)} />
        <StatTile
          label="Active swaps"
          value={String(kpis.activeSwaps)}
          hint={kpis.pendingProposals ? `${kpis.pendingProposals} pending proposal${kpis.pendingProposals === 1 ? "" : "s"}` : undefined}
        />
        <StatTile
          label="Average rating"
          value={kpis.averageRating !== null ? `${kpis.averageRating.toFixed(1)} ★` : "—"}
          hint={kpis.ratingCount ? `from ${kpis.ratingCount} review${kpis.ratingCount === 1 ? "" : "s"}` : "No reviews yet"}
        />
        <StatTile
          label="Credit balance"
          value={`$${kpis.balance.toLocaleString()}`}
          hint={`Member since ${formatMemberSince(kpis.memberSince)}`}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <ChartCard
          title="Swap activity"
          subtitle="Swaps started vs completed, last 6 months"
          source={activity.source}
          className="lg:col-span-2"
        >
          <ColumnChart
            ariaLabel="Swaps started and completed per month"
            categories={activity.months.map((m) => m.label)}
            series={[
              { name: "Started", color: SERIES[0], values: activity.months.map((m) => m.started) },
              { name: "Completed", color: SERIES[1], values: activity.months.map((m) => m.completed) },
            ]}
          />
        </ChartCard>

        <ChartCard title="Profile strength" subtitle="Complete profiles get more swap requests">
          <div className="flex items-center gap-5">
            <RingMeter percent={completeness.percent} />
            <ul className="min-w-0 space-y-1.5 text-sm">
              {completeness.items.map((item) => (
                <li key={item.label} className={item.done ? "text-slate-600" : "text-slate-400"}>
                  <span className={item.done ? "text-emerald-600" : "text-slate-300"} aria-hidden="true">
                    {item.done ? "✓" : "○"}
                  </span>{" "}
                  {item.label}
                  <span className="sr-only">{item.done ? " (done)" : " (missing)"}</span>
                </li>
              ))}
            </ul>
          </div>
        </ChartCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <ChartCard title="Swaps by status" subtitle="Where your swaps stand right now" source={status.source}>
          <StackedBar
            segments={status.segments.map((s) => ({
              label: s.label,
              value: s.value,
              color: statusColors[s.key],
            }))}
          />
        </ChartCard>

        <ChartCard
          title="Demand for your skills"
          subtitle="Members who want what you offer"
          source={demand.source}
        >
          <BarList
            items={demand.skills.map((s) => ({ label: s.skill, value: s.wanted }))}
            formatValue={(v) => `${v} ${v === 1 ? "member" : "members"}`}
          />
        </ChartCard>

        <ChartCard title="Ratings received" subtitle="From completed swaps" source={ratings.source}>
          <div className="mb-4 flex items-baseline gap-2">
            <span className="text-3xl font-bold tabular-nums text-slate-900">
              {ratings.average ? ratings.average.toFixed(1) : "—"}
            </span>
            <span className="text-sm text-slate-500">
              average · {ratings.total} rating{ratings.total === 1 ? "" : "s"}
            </span>
          </div>
          <BarList
            items={ratings.buckets.map((b) => ({ label: `${b.stars} star${b.stars === 1 ? "" : "s"}`, value: b.count }))}
          />
        </ChartCard>
      </div>

      <ChartCard title="Messages sent" subtitle="Chat activity, last 6 months" source={messages.source}>
        <ColumnChart
          height={140}
          ariaLabel="Messages sent per month"
          categories={messages.months.map((m) => m.label)}
          series={[{ name: "Messages", color: SERIES[0], values: messages.months.map((m) => m.count) }]}
        />
      </ChartCard>
    </div>
  );
}
