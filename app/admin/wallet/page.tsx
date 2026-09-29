"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AdminShell } from "@/features/admin/AdminShell";
import {
  Badge,
  Card,
  dateTime,
  EmptyRow,
  LoadingRows,
  money,
  PageHeader,
  Pagination,
  SearchInput,
  Select,
  StatTile,
  Table,
  Toolbar,
} from "@/features/admin/ui";
import { adminApi, type Paged, type Totals, type TransactionRow } from "@/services/adminApi";

const TYPE_LABEL: Record<string, { label: string; tone: "green" | "amber" | "blue" }> = {
  deposit: { label: "Top-up", tone: "green" },
  escrow_hold: { label: "Escrow held", tone: "amber" },
  escrow_release: { label: "Escrow returned", tone: "blue" },
  escrow_refund: { label: "Escrow refunded", tone: "blue" },
};

export default function AdminWalletPage() {
  const [data, setData] = useState<(Paged<TransactionRow> & { totals: Totals }) | null>(null);
  const [search, setSearch] = useState("");
  const [type, setType] = useState("all");
  const [page, setPage] = useState(1);

  const load = useCallback(() => {
    setData(null);
    adminApi.transactions({ search, type, page }).then(setData).catch(() => setData(null));
  }, [search, type, page]);

  useEffect(() => {
    const t = setTimeout(load, search ? 300 : 0);
    return () => clearTimeout(t);
  }, [load, search]);

  return (
    <AdminShell>
      <PageHeader title="Wallet & escrow" subtitle="Every money movement on the platform (payments are simulated in demo mode)." />

      <div className="mb-5 grid gap-4 sm:grid-cols-3">
        <StatTile label="Top-ups (filtered)" value={money(data?.totals.deposits ?? 0)} tone="good" />
        <StatTile label="Escrow held (filtered)" value={money(data?.totals.holds ?? 0)} tone="warning" />
        <StatTile label="Escrow returned (filtered)" value={money(data?.totals.releases ?? 0)} />
      </div>

      <Toolbar>
        <SearchInput value={search} onChange={(v) => { setPage(1); setSearch(v); }} placeholder="Search member or transaction id" />
        <Select
          label="Transaction type"
          value={type}
          onChange={(v) => { setPage(1); setType(v); }}
          options={[
            { value: "all", label: "All types" },
            { value: "deposit", label: "Top-ups" },
            { value: "escrow_hold", label: "Escrow held" },
            { value: "escrow_release", label: "Escrow returned" },
            { value: "escrow_refund", label: "Escrow refunded" },
          ]}
        />
      </Toolbar>

      <Card>
        <Table head={["Member", "Type", "Amount", "Balance after", "Reference", "When"]}>
          {!data ? (
            <LoadingRows colSpan={6} />
          ) : data.rows.length === 0 ? (
            <EmptyRow colSpan={6}>No transactions found.</EmptyRow>
          ) : (
            data.rows.map((t) => {
              const meta = TYPE_LABEL[t.type] ?? { label: t.type, tone: "blue" as const };
              return (
                <tr key={t.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <Link href={`/admin/users/${encodeURIComponent(t.user.id)}`} className="font-semibold text-slate-900 hover:text-swapspot-blue">
                      {t.user.name}
                    </Link>
                    <p className="text-xs text-slate-500">{t.user.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={meta.tone}>{meta.label}</Badge>
                    {t.status !== "succeeded" ? <Badge tone="red">Declined</Badge> : null}
                    {t.note ? <p className="mt-1 max-w-xs truncate text-xs text-slate-400">{t.note}</p> : null}
                  </td>
                  <td className="px-4 py-3 font-semibold tabular-nums text-slate-900">{money(t.amount)}</td>
                  <td className="px-4 py-3 tabular-nums text-slate-500">{t.balanceAfter === null ? "—" : money(t.balanceAfter)}</td>
                  <td className="px-4 py-3">
                    <p className="font-mono text-[11px] text-slate-400">{t.id}</p>
                    {t.card ? <p className="text-xs text-slate-500">{t.card}</p> : null}
                    {t.failureReason ? <p className="text-xs text-rose-500">{t.failureReason}</p> : null}
                  </td>
                  <td className="px-4 py-3 text-slate-500">{dateTime(t.createdAt)}</td>
                </tr>
              );
            })
          )}
        </Table>
        {data ? <Pagination page={data.page} pageSize={data.pageSize} total={data.total} onPage={setPage} /> : null}
      </Card>
    </AdminShell>
  );
}
