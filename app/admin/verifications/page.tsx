"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AdminShell } from "@/features/admin/AdminShell";
import { ActionButton, Badge, Card, dateTime, PageHeader, Select, Toolbar } from "@/features/admin/ui";
import { adminApi, type VerificationRow } from "@/services/adminApi";

export default function AdminVerificationsPage() {
  const [rows, setRows] = useState<VerificationRow[] | null>(null);
  const [status, setStatus] = useState("pending");
  const [busy, setBusy] = useState<string | null>(null);
  const [reason, setReason] = useState("");

  const load = useCallback(() => {
    setRows(null);
    adminApi.verifications(status).then((r) => setRows(r.verifications)).catch(() => setRows([]));
  }, [status]);

  useEffect(load, [load]);

  async function act(userId: string, action: "approve" | "reject") {
    setBusy(userId);
    try {
      await adminApi.verificationAction(userId, action, reason);
      setReason("");
      load();
    } finally {
      setBusy(null);
    }
  }

  return (
    <AdminShell>
      <PageHeader title="ID verifications" subtitle="Passport documents submitted by members. Documents are private and only visible here." />

      <Toolbar>
        <Select
          label="Filter"
          value={status}
          onChange={setStatus}
          options={[
            { value: "pending", label: "Waiting for review" },
            { value: "verified", label: "Approved" },
            { value: "all", label: "All submissions" },
          ]}
        />
        <input
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Optional note for the audit log"
          aria-label="Review note"
          className="w-72 rounded-lg border border-slate-200 px-3.5 py-2 text-sm focus:border-swapspot-blue focus:outline-none"
        />
      </Toolbar>

      {rows === null ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {[0, 1].map((i) => (
            <div key={i} className="h-64 animate-pulse rounded-2xl bg-slate-100" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <Card className="p-10 text-center text-slate-500">Nothing to review here.</Card>
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          {rows.map((r) => (
            <Card key={r.userId} className="overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-5 py-3">
                <div>
                  <p className="font-semibold text-slate-900">{r.name}</p>
                  <p className="text-xs text-slate-500">{r.email}</p>
                </div>
                {r.verified ? <Badge tone="green">Approved {r.verifiedAt ? `· ${dateTime(r.verifiedAt)}` : ""}</Badge> : <Badge tone="amber">Waiting</Badge>}
              </div>

              <div className="grid grid-cols-2 gap-3 p-5">
                {(["front", "back"] as const).map((side) => (
                  <a
                    key={side}
                    href={`/api/admin/verifications/${encodeURIComponent(r.userId)}/document/${side}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block overflow-hidden rounded-xl border border-slate-200"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`/api/admin/verifications/${encodeURIComponent(r.userId)}/document/${side}`}
                      alt={`Passport ${side}`}
                      className="aspect-[1.4] w-full bg-slate-100 object-cover"
                    />
                    <p className="px-3 py-2 text-xs capitalize text-slate-500">Passport {side} — open full size</p>
                  </a>
                ))}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 px-5 py-3">
                <p className="text-xs text-slate-400">Submitted {dateTime(r.submittedAt)} · {r.documents} files</p>
                <div className="flex gap-2">
                  <Link href={`/admin/users/${encodeURIComponent(r.userId)}`} className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-600 hover:bg-slate-50">
                    Open member
                  </Link>
                  {r.verified ? (
                    <ActionButton tone="danger" disabled={busy === r.userId} onClick={() => act(r.userId, "reject")}>
                      Revoke
                    </ActionButton>
                  ) : (
                    <>
                      <ActionButton tone="primary" disabled={busy === r.userId} onClick={() => act(r.userId, "approve")}>
                        Approve
                      </ActionButton>
                      <ActionButton tone="danger" disabled={busy === r.userId} onClick={() => act(r.userId, "reject")}>
                        Reject
                      </ActionButton>
                    </>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </AdminShell>
  );
}
