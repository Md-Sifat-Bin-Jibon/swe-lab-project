"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { AdminShell } from "@/features/admin/AdminShell";
import {
  ActionButton,
  Badge,
  Card,
  dateTime,
  money,
  PageHeader,
  Table,
} from "@/features/admin/ui";
import { adminApi, type UserDetail } from "@/services/adminApi";

export default function AdminUserDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [data, setData] = useState<UserDetail | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [amount, setAmount] = useState("");

  const load = useCallback(() => {
    adminApi.user(id).then(setData).catch(() => setError("Could not load this member."));
  }, [id]);

  useEffect(load, [load]);

  async function run(body: Record<string, unknown>) {
    setBusy(true);
    setError(null);
    try {
      setData(await adminApi.userAction(id, body));
      setReason("");
      setAmount("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed.");
    } finally {
      setBusy(false);
    }
  }

  if (!data) {
    return (
      <AdminShell>
        {error ? <p className="text-sm text-rose-600">{error}</p> : <div className="h-72 animate-pulse rounded-2xl bg-slate-100" />}
      </AdminShell>
    );
  }

  const u = data.user;

  return (
    <AdminShell>
      <Link href="/admin/users" className="mb-3 inline-block text-sm text-slate-500 hover:text-slate-800">
        ← All users
      </Link>
      <PageHeader
        title={u.name}
        subtitle={`${u.email}${u.phone ? ` · ${u.phone}` : ""}${u.location ? ` · ${u.location}` : ""}`}
        actions={
          <div className="flex flex-wrap gap-2">
            <Link href={`/profiles/${encodeURIComponent(u.id)}`} className="rounded-lg border border-slate-200 px-3.5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              View public profile
            </Link>
            {u.status === "suspended" ? (
              <ActionButton tone="primary" disabled={busy} onClick={() => run({ action: "activate", reason })}>
                Reactivate
              </ActionButton>
            ) : (
              <ActionButton tone="danger" disabled={busy} onClick={() => run({ action: "suspend", reason })}>
                Suspend
              </ActionButton>
            )}
          </div>
        }
      />

      {error ? <p className="mb-4 rounded-lg bg-rose-50 px-4 py-2.5 text-sm text-rose-700">{error}</p> : null}

      <div className="mb-6 flex flex-wrap gap-2">
        {u.status === "suspended" ? <Badge tone="red">Suspended{u.suspendedReason ? ` · ${u.suspendedReason}` : ""}</Badge> : <Badge tone="green">Active</Badge>}
        {u.idVerified ? <Badge tone="blue">ID verified {u.idVerifiedAt ? `· ${dateTime(u.idVerifiedAt)}` : ""}</Badge> : <Badge tone="amber">ID not verified</Badge>}
        {u.emailVerified ? <Badge tone="green">Email verified</Badge> : <Badge tone="amber">Email unverified</Badge>}
        {u.onboarded ? <Badge tone="neutral">Onboarded</Badge> : <Badge tone="amber">Onboarding incomplete</Badge>}
        {u.browseable ? <Badge tone="neutral">Listed in Browse</Badge> : <Badge tone="neutral">Hidden from Browse</Badge>}
        <Badge tone="violet">Balance {money(u.balance)}</Badge>
        <Badge tone="neutral">Rating {u.rating}</Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <h2 className="mb-3 text-base font-bold text-slate-900">Moderation</h2>
          <label htmlFor="admin-reason" className="mb-1.5 block text-sm text-slate-600">
            Note / reason (saved to the audit log)
          </label>
          <input
            id="admin-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            maxLength={300}
            placeholder="e.g. Spam reports from three members"
            className="mb-4 w-full rounded-lg border border-slate-200 px-3.5 py-2 text-sm focus:border-swapspot-blue focus:outline-none"
          />
          <div className="flex flex-wrap gap-2">
            {u.idVerified ? (
              <ActionButton disabled={busy} onClick={() => run({ action: "unverify", reason })}>
                Remove ID verification
              </ActionButton>
            ) : (
              <ActionButton disabled={busy} onClick={() => run({ action: "verify", reason })}>
                Mark ID verified
              </ActionButton>
            )}
            <ActionButton disabled={busy} onClick={() => run({ action: "browseable", value: !u.browseable })}>
              {u.browseable ? "Hide from Browse" : "Show in Browse"}
            </ActionButton>
          </div>

          <div className="mt-5 border-t border-slate-100 pt-4">
            <p className="mb-2 text-sm font-semibold text-slate-700">Adjust balance</p>
            <div className="flex flex-wrap items-center gap-2">
              <input
                value={amount}
                onChange={(e) => setAmount(e.target.value.replace(/[^\d.-]/g, ""))}
                placeholder="e.g. 25 or -10"
                inputMode="decimal"
                aria-label="Adjustment amount"
                className="w-40 rounded-lg border border-slate-200 px-3.5 py-2 text-sm focus:border-swapspot-blue focus:outline-none"
              />
              <ActionButton tone="primary" disabled={busy || !amount} onClick={() => run({ action: "adjustBalance", amount: Number(amount), reason })}>
                Apply adjustment
              </ActionButton>
              <span className="text-xs text-slate-400">Positive credits the wallet, negative debits it.</span>
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="mb-3 text-base font-bold text-slate-900">Skills</h2>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Offers</p>
          <div className="mb-3 mt-1.5 flex flex-wrap gap-1.5">
            {data.skills.offer.length ? data.skills.offer.map((s) => <Badge key={s} tone="blue">{s}</Badge>) : <span className="text-sm text-slate-400">None</span>}
          </div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Wants</p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {data.skills.want.length ? data.skills.want.map((s) => <Badge key={s} tone="green">{s}</Badge>) : <span className="text-sm text-slate-400">None</span>}
          </div>
          {u.bio ? (
            <>
              <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-slate-400">Bio</p>
              <p className="mt-1 text-sm leading-relaxed text-slate-600">{u.bio}</p>
            </>
          ) : null}
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="px-5 pt-5 text-base font-bold text-slate-900">Swaps ({data.swaps.length})</h2>
          <Table minWidth={420} head={["Swap", "Role", "Exchange", "Deposit"]}>
            {data.swaps.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-slate-400">No swaps yet.</td>
              </tr>
            ) : (
              data.swaps.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50">
                  <td className="px-4 py-2.5">
                    <Badge tone={s.type === "ongoing" ? "blue" : s.type === "completed" ? "green" : "amber"}>{s.type}</Badge>
                    <p className="mt-1 text-xs text-slate-400">{s.status}</p>
                  </td>
                  <td className="px-4 py-2.5 capitalize text-slate-600">{s.role}</td>
                  <td className="px-4 py-2.5 text-slate-600">{s.gives || "—"} ⇄ {s.gets || "—"}</td>
                  <td className="px-4 py-2.5 tabular-nums text-slate-900">{money(s.deposit)}</td>
                </tr>
              ))
            )}
          </Table>
        </Card>

        <Card>
          <h2 className="px-5 pt-5 text-base font-bold text-slate-900">Wallet history</h2>
          <Table minWidth={460} head={["Type", "Amount", "Balance after", "When"]}>
            {data.transactions.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-slate-400">No transactions.</td>
              </tr>
            ) : (
              data.transactions.map((t) => (
                <tr key={t.id}>
                  <td className="px-4 py-2.5">
                    <span className="text-slate-700">{t.type.replace("_", " ")}</span>
                    {t.note ? <p className="text-xs text-slate-400">{t.note}</p> : null}
                  </td>
                  <td className="px-4 py-2.5 tabular-nums text-slate-900">{money(t.amount)}</td>
                  <td className="px-4 py-2.5 tabular-nums text-slate-500">{t.balanceAfter === null ? "—" : money(t.balanceAfter)}</td>
                  <td className="px-4 py-2.5 text-slate-500">{dateTime(t.createdAt)}</td>
                </tr>
              ))
            )}
          </Table>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="mb-3 text-base font-bold text-slate-900">ID documents</h2>
          {data.documents.length === 0 ? (
            <p className="text-sm text-slate-400">No documents submitted.</p>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {data.documents.map((d) => (
                <a
                  key={d.side}
                  href={`/api/admin/verifications/${encodeURIComponent(u.id)}/document/${d.side}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block overflow-hidden rounded-xl border border-slate-200"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`/api/admin/verifications/${encodeURIComponent(u.id)}/document/${d.side}`} alt={`Passport ${d.side}`} className="aspect-[1.4] w-full bg-slate-100 object-cover" />
                  <p className="px-3 py-2 text-xs capitalize text-slate-600">
                    {d.side} · {Math.round(d.sizeBytes / 1024)} KB · {dateTime(d.uploadedAt)}
                  </p>
                </a>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-5">
          <h2 className="mb-3 text-base font-bold text-slate-900">Projects ({data.projects.length})</h2>
          {data.projects.length === 0 ? (
            <p className="text-sm text-slate-400">No projects.</p>
          ) : (
            <ul className="space-y-2">
              {data.projects.map((p) => (
                <li key={p.id} className="flex items-center gap-3 rounded-lg border border-slate-100 p-2">
                  <span className="h-10 w-14 shrink-0 overflow-hidden rounded bg-slate-100">
                    {p.images[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.images[0]} alt="" className="h-full w-full object-cover" />
                    ) : null}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-slate-800">{p.title}</span>
                    <span className="text-xs text-slate-400">{p.skill || "—"}</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </AdminShell>
  );
}
