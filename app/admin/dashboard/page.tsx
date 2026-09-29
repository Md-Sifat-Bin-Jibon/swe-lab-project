"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AdminShell } from "@/features/admin/AdminShell";
import { BarList, ChartCard, ColumnChart, SERIES, StackedBar } from "@/features/profile/insights/charts";
import { Card, money, PageHeader, StatTile } from "@/features/admin/ui";
import { adminApi, type Overview } from "@/services/adminApi";

export default function AdminDashboardPage() {
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    adminApi
      .overview()
      .then((r) => setData(r.overview))
      .catch(() => setError(true));
  }, []);

  return (
    <AdminShell>
      <PageHeader title="Platform overview" subtitle="Everything happening across SwapSpot right now." />

      {error ? (
        <p className="text-sm text-rose-600">Could not load the overview.</p>
      ) : !data ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-slate-100" />
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatTile label="Members" value={data.users.total} hint={`+${data.users.newLast7Days} in the last 7 days`} />
            <StatTile label="ID verified" value={data.users.verified} hint={`${data.users.suspended} suspended`} tone="good" />
            <StatTile label="Active swaps" value={data.swaps.ongoing} hint={`${data.swaps.proposals} pending proposals`} />
            <StatTile
              label="Open disputes"
              value={data.swaps.disputes}
              tone={data.swaps.disputes ? "danger" : "default"}
              hint={data.swaps.disputes ? "Needs attention" : "All clear"}
            />
            <StatTile label="Escrow held" value={money(data.money.escrowHeld)} hint="Across proposals and active swaps" tone="warning" />
            <StatTile label="Member balances" value={money(data.money.memberBalances)} hint="Total wallet funds" />
            <StatTile label="Top-ups" value={money(data.money.depositsTotal)} hint={`${data.money.depositsCount} payments (demo)`} />
            <StatTile
              label="Flagged messages"
              value={data.moderation.flaggedLast7Days}
              tone={data.moderation.flaggedLast7Days ? "warning" : "default"}
              hint={`${data.moderation.flaggedTotal} all time`}
            />
            <StatTile label="Upcoming meetings" value={data.meetings.upcoming} hint={`${data.meetings.total} scheduled in total`} />
            <StatTile
              label="Verifications waiting"
              value={data.pendingVerifications}
              tone={data.pendingVerifications ? "warning" : "default"}
              hint={data.pendingVerifications ? "Review submitted IDs" : "Queue empty"}
            />
          </div>

          {data.pendingVerifications > 0 || data.swaps.disputes > 0 ? (
            <Card className="flex flex-wrap items-center justify-between gap-3 border-amber-200 bg-amber-50 p-4">
              <p className="text-sm text-amber-900">
                <strong>Needs your attention:</strong>{" "}
                {[
                  data.pendingVerifications ? `${data.pendingVerifications} ID verification(s)` : null,
                  data.swaps.disputes ? `${data.swaps.disputes} open dispute(s)` : null,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
              <div className="flex gap-2">
                {data.pendingVerifications ? (
                  <Link href="/admin/verifications" className="rounded-lg bg-amber-600 px-3.5 py-2 text-sm font-semibold text-white hover:bg-amber-700">
                    Review IDs
                  </Link>
                ) : null}
                {data.swaps.disputes ? (
                  <Link href="/admin/swaps?type=dispute" className="rounded-lg bg-rose-500 px-3.5 py-2 text-sm font-semibold text-white hover:bg-rose-600">
                    Open disputes
                  </Link>
                ) : null}
              </div>
            </Card>
          ) : null}

          <div className="grid gap-6 lg:grid-cols-3">
            <ChartCard title="Platform growth" subtitle="Sign-ups, proposals and completed swaps per month" className="lg:col-span-2">
              <ColumnChart
                ariaLabel="Sign-ups, proposals and completed swaps per month"
                categories={data.months.map((m) => m.label)}
                series={[
                  { name: "Sign-ups", color: SERIES[0], values: data.months.map((m) => m.signups) },
                  { name: "Proposals", color: SERIES[1], values: data.months.map((m) => m.proposals) },
                  { name: "Completed", color: SERIES[2], values: data.months.map((m) => m.completed) },
                ]}
              />
            </ChartCard>

            <ChartCard title="Swaps by status" subtitle="Everything in the system">
              <StackedBar
                segments={[
                  { label: "Active", value: data.swaps.ongoing, color: SERIES[0] },
                  { label: "Pending", value: data.swaps.proposals, color: SERIES[1] },
                  { label: "Completed", value: data.swaps.completed, color: SERIES[2] },
                  { label: "Disputed", value: data.swaps.disputes, color: SERIES[3] },
                ]}
              />
            </ChartCard>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <ChartCard title="Most offered skills" subtitle="What members can teach">
              <BarList items={data.topOffered.map((s) => ({ label: s.skill, value: s.count }))} formatValue={(v) => `${v}`} />
            </ChartCard>
            <ChartCard title="Most wanted skills" subtitle="What members want to learn">
              <BarList items={data.topWanted.map((s) => ({ label: s.skill, value: s.count }))} color={SERIES[1]} formatValue={(v) => `${v}`} />
            </ChartCard>
            <ChartCard title="Content" subtitle="User-generated content on the platform">
              <BarList
                items={[
                  { label: "Projects", value: data.content.projects },
                  { label: "Conversations", value: data.content.conversations },
                  { label: "Messages", value: data.content.messages },
                  { label: "Swap to-dos", value: data.content.tasks },
                ]}
                color={SERIES[2]}
                formatValue={(v) => `${v}`}
              />
            </ChartCard>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
