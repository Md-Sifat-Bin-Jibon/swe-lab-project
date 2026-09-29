"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AdminShell } from "@/features/admin/AdminShell";
import {
  ActionButton,
  Badge,
  Card,
  dateOnly,
  dateTime,
  EmptyRow,
  LoadingRows,
  Modal,
  money,
  PageHeader,
  Pagination,
  SearchInput,
  Select,
  Table,
  Toolbar,
} from "@/features/admin/ui";
import { adminApi, type AdminSwapRow, type Paged, type SwapDetail } from "@/services/adminApi";

function SwapsView() {
  const params = useSearchParams();
  const [data, setData] = useState<Paged<AdminSwapRow> | null>(null);
  const [search, setSearch] = useState("");
  const [type, setType] = useState(params.get("type") ?? "all");
  const [page, setPage] = useState(1);
  const [detail, setDetail] = useState<SwapDetail | null>(null);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setData(null);
    adminApi.swaps({ search, type, page }).then(setData).catch(() => setData({ rows: [], total: 0, page: 1, pageSize: 20 }));
  }, [search, type, page]);

  useEffect(() => {
    const t = setTimeout(load, search ? 300 : 0);
    return () => clearTimeout(t);
  }, [load, search]);

  async function act(id: string, body: Record<string, unknown>) {
    setBusy(true);
    setError(null);
    try {
      await adminApi.swapAction(id, { ...body, note });
      setDetail(null);
      setNote("");
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHeader title="Swaps" subtitle="Every proposal, active swap and completed exchange." />

      <Toolbar>
        <SearchInput value={search} onChange={(v) => { setPage(1); setSearch(v); }} placeholder="Search by member, skill or id" />
        <Select
          label="Filter swaps"
          value={type}
          onChange={(v) => { setPage(1); setType(v); }}
          options={[
            { value: "all", label: "All swaps" },
            { value: "proposal", label: "Proposals" },
            { value: "ongoing", label: "Active" },
            { value: "completed", label: "Completed" },
            { value: "dispute", label: "In dispute" },
          ]}
        />
      </Toolbar>

      <Card>
        <Table head={["Swap", "Members", "Exchange", "Escrow", "Progress", ""]}>
          {!data ? (
            <LoadingRows colSpan={6} />
          ) : data.rows.length === 0 ? (
            <EmptyRow colSpan={6}>No swaps match this filter.</EmptyRow>
          ) : (
            data.rows.map((s) => (
              <tr key={s.id} className="hover:bg-slate-50">
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    <Badge tone={s.type === "ongoing" ? "blue" : s.type === "completed" ? "green" : "amber"}>{s.type}</Badge>
                    {s.inDispute ? <Badge tone="red">Dispute</Badge> : null}
                    {s.counters > 0 ? <Badge tone="violet">{s.counters} counters</Badge> : null}
                  </div>
                  <p className="mt-1 font-mono text-[11px] text-slate-400">{s.id}</p>
                </td>
                <td className="px-4 py-3 text-slate-700">
                  {s.owner.name}
                  <span className="text-slate-400"> → </span>
                  {s.partner?.name ?? "—"}
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {s.ownerOffer || "—"} ⇄ {s.partnerOffer || "—"}
                  <p className="text-xs text-slate-400">{s.deadline ? `Ends ${dateOnly(s.deadline)}` : "No end date"}</p>
                </td>
                <td className="px-4 py-3 tabular-nums text-slate-900">
                  {money(s.deposit)}
                  {s.depositHeld !== s.deposit ? <p className="text-xs text-amber-600">held {money(s.depositHeld)}</p> : null}
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {s.tasks.total ? `${s.tasks.done}/${s.tasks.total} to-dos` : "—"}
                  {s.rating ? <p className="text-xs text-amber-500">{s.rating}★</p> : null}
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    type="button"
                    onClick={() => adminApi.swap(s.id).then(setDetail).catch(() => setError("Could not load the swap."))}
                    className="font-semibold text-swapspot-blue hover:underline"
                  >
                    Inspect
                  </button>
                </td>
              </tr>
            ))
          )}
        </Table>
        {data ? <Pagination page={data.page} pageSize={data.pageSize} total={data.total} onPage={setPage} /> : null}
      </Card>

      {error ? <p className="mt-4 text-sm text-rose-600">{error}</p> : null}

      {detail ? (
        <Modal title={`Swap ${detail.swap.id}`} onClose={() => setDetail(null)} wide>
          <div className="grid gap-4 sm:grid-cols-4">
            {[
              ["Type", detail.swap.type],
              ["Status", detail.swap.status || "—"],
              ["Escrow", money(detail.swap.deposit)],
              ["Waiting on", detail.swap.awaiting ?? "—"],
            ].map(([k, v]) => (
              <div key={k} className="rounded-xl bg-slate-50 p-3">
                <p className="text-xs uppercase tracking-wide text-slate-400">{k}</p>
                <p className="mt-0.5 font-semibold text-slate-900">{v}</p>
              </div>
            ))}
          </div>

          <p className="mt-4 whitespace-pre-line text-sm text-slate-600">{detail.swap.description || "No description."}</p>

          <h3 className="mt-6 text-sm font-bold uppercase tracking-wide text-slate-400">Negotiation ({detail.offers.length})</h3>
          <ul className="mt-2 space-y-2">
            {detail.offers.map((o, i) => (
              <li key={i} className="rounded-lg border border-slate-100 p-3 text-sm">
                <p className="font-semibold text-slate-800">
                  {o.author} · {o.kind}
                  <span className="ml-2 text-xs font-normal text-slate-400">{dateTime(o.createdAt)}</span>
                </p>
                <p className="text-slate-600">
                  {o.ownerOffer} ⇄ {o.partnerOffer}
                  {o.deposit !== null ? ` · escrow ${money(o.deposit)}` : ""}
                  {o.deadline ? ` · ends ${dateOnly(o.deadline)}` : ""}
                </p>
                {o.message ? <p className="mt-1 italic text-slate-500">&ldquo;{o.message}&rdquo;</p> : null}
              </li>
            ))}
            {detail.offers.length === 0 ? <li className="text-sm text-slate-400">No offer history.</li> : null}
          </ul>

          {detail.tasks.length ? (
            <>
              <h3 className="mt-6 text-sm font-bold uppercase tracking-wide text-slate-400">To-dos ({detail.tasks.filter((t) => t.done).length}/{detail.tasks.length})</h3>
              <ul className="mt-2 space-y-1 text-sm">
                {detail.tasks.map((t, i) => (
                  <li key={i} className={t.done ? "text-slate-400 line-through" : "text-slate-700"}>
                    {t.assignee}: {t.title} <span className="text-xs text-slate-400">({t.category}{t.dueDate ? ` · ${dateOnly(t.dueDate)}` : ""})</span>
                  </li>
                ))}
              </ul>
            </>
          ) : null}

          <div className="mt-6 border-t border-slate-100 pt-4">
            <label htmlFor="swap-note" className="mb-1.5 block text-sm text-slate-600">
              Note (saved to the audit log)
            </label>
            <input
              id="swap-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={300}
              className="mb-3 w-full rounded-lg border border-slate-200 px-3.5 py-2 text-sm focus:border-swapspot-blue focus:outline-none"
            />
            <div className="flex flex-wrap gap-2">
              {detail.swap.type === "proposal" ? (
                <ActionButton tone="danger" disabled={busy} onClick={() => act(detail.swap.id, { action: "cancel" })}>
                  Cancel proposal &amp; refund escrow
                </ActionButton>
              ) : null}
              {detail.swap.inDispute ? (
                <>
                  <ActionButton tone="danger" disabled={busy} onClick={() => act(detail.swap.id, { action: "resolveDispute", outcome: "refund" })}>
                    Close swap &amp; refund escrow
                  </ActionButton>
                  <ActionButton disabled={busy} onClick={() => act(detail.swap.id, { action: "resolveDispute", outcome: "release" })}>
                    Dismiss dispute &amp; continue
                  </ActionButton>
                </>
              ) : null}
            </div>
          </div>
        </Modal>
      ) : null}
    </>
  );
}

export default function AdminSwapsPage() {
  return (
    <AdminShell>
      <Suspense fallback={<div className="h-72 animate-pulse rounded-2xl bg-slate-100" />}>
        <SwapsView />
      </Suspense>
    </AdminShell>
  );
}
