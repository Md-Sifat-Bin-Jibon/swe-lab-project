"use client";

import { useEffect, useState } from "react";
import { AdminShell } from "@/features/admin/AdminShell";
import { Badge, Card, dateTime, PageHeader, Table } from "@/features/admin/ui";
import { adminApi, type SystemInfo } from "@/services/adminApi";

const COUNT_LABELS: Record<string, string> = {
  users: "Users",
  swaps: "Swaps",
  messages: "Messages",
  projects: "Projects",
  transactions: "Wallet transactions",
  events: "Activity events",
  tasks: "Swap to-dos",
  documents: "ID documents",
  meetings: "Meetings",
  flags: "Moderation flags",
};

export default function AdminSettingsPage() {
  const [system, setSystem] = useState<SystemInfo | null>(null);

  useEffect(() => {
    adminApi.settings().then((r) => setSystem(r.system)).catch(() => setSystem(null));
  }, []);

  return (
    <AdminShell>
      <PageHeader title="Settings & system" subtitle="Integrations, data volumes and admin accounts." />

      {!system ? (
        <div className="h-64 animate-pulse rounded-2xl bg-slate-100" />
      ) : (
        <div className="space-y-6">
          <div className="grid gap-5 lg:grid-cols-2">
            <Card className="p-5">
              <h2 className="mb-4 text-base font-bold text-slate-900">Integrations</h2>
              <ul className="space-y-3 text-sm">
                <li className="flex items-center justify-between gap-3">
                  <span className="text-slate-600">Email (SMTP) — OTP and password reset</span>
                  {system.integrations.smtp ? <Badge tone="green">Configured</Badge> : <Badge tone="amber">Not configured</Badge>}
                </li>
                <li className="flex items-center justify-between gap-3">
                  <span className="text-slate-600">OpenAI — AI swap plans ({system.integrations.openaiModel})</span>
                  {system.integrations.openai ? <Badge tone="green">Configured</Badge> : <Badge tone="amber">Standard plans only</Badge>}
                </li>
                <li className="flex items-center justify-between gap-3">
                  <span className="text-slate-600">Google Meet — meeting links</span>
                  {system.integrations.googleMeet ? <Badge tone="green">Connected</Badge> : <Badge tone="amber">SwapSpot rooms only</Badge>}
                </li>
                <li className="flex items-center justify-between gap-3">
                  <span className="text-slate-600">Payments</span>
                  <Badge tone="amber">Demo mode — no real charges</Badge>
                </li>
                <li className="flex items-center justify-between gap-3">
                  <span className="text-slate-600">App URL</span>
                  <span className="font-mono text-xs text-slate-500">{system.integrations.appUrl}</span>
                </li>
                <li className="flex items-center justify-between gap-3">
                  <span className="text-slate-600">Environment</span>
                  <span className="text-xs text-slate-500">
                    {system.environment} · Node {system.node}
                  </span>
                </li>
              </ul>
              <p className="mt-4 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
                These are read from environment variables. Change them in <code>.env.local</code> and restart the server.
              </p>
            </Card>

            <Card className="p-5">
              <h2 className="mb-4 text-base font-bold text-slate-900">Stored data</h2>
              <dl className="grid grid-cols-2 gap-3 text-sm">
                {Object.entries(system.counts).map(([key, value]) => (
                  <div key={key} className="rounded-xl bg-slate-50 p-3">
                    <dt className="text-slate-500">{COUNT_LABELS[key] ?? key}</dt>
                    <dd className="mt-0.5 text-xl font-bold tabular-nums text-slate-900">{value}</dd>
                  </div>
                ))}
              </dl>
            </Card>
          </div>

          <Card>
            <h2 className="px-5 pt-5 text-base font-bold text-slate-900">Admin accounts</h2>
            <Table head={["Admin", "Role", "Created", "Last sign-in"]}>
              {system.admins.map((a) => (
                <tr key={a.id}>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-slate-900">{a.name || a.email}</p>
                    <p className="text-xs text-slate-500">{a.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={a.role === "owner" ? "violet" : "blue"}>{a.role}</Badge>
                  </td>
                  <td className="px-4 py-3 text-slate-500">{dateTime(a.createdAt)}</td>
                  <td className="px-4 py-3 text-slate-500">{dateTime(a.lastLoginAt)}</td>
                </tr>
              ))}
            </Table>
            <p className="px-5 pb-5 pt-3 text-xs text-slate-500">
              The first admin is created from <code>ADMIN_EMAIL</code> / <code>ADMIN_PASSWORD</code> on first run. Change the
              password in <code>.env.local</code> before deploying.
            </p>
          </Card>
        </div>
      )}
    </AdminShell>
  );
}
