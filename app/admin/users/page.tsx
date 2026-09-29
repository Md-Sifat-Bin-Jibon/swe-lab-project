"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AdminShell } from "@/features/admin/AdminShell";
import {
  Badge,
  Card,
  dateOnly,
  EmptyRow,
  LoadingRows,
  money,
  PageHeader,
  Pagination,
  SearchInput,
  Select,
  Table,
  Toolbar,
} from "@/features/admin/ui";
import { adminApi, type AdminUserRow, type Paged } from "@/services/adminApi";

export default function AdminUsersPage() {
  const [data, setData] = useState<Paged<AdminUserRow> | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);

  const load = useCallback(() => {
    setData(null);
    adminApi.users({ search, status, page }).then(setData).catch(() => setData({ rows: [], total: 0, page: 1, pageSize: 20 }));
  }, [search, status, page]);

  useEffect(() => {
    const t = setTimeout(load, search ? 300 : 0);
    return () => clearTimeout(t);
  }, [load, search]);

  return (
    <AdminShell>
      <PageHeader title="Users" subtitle="Every member, their status, balance and activity." />

      <Toolbar>
        <SearchInput value={search} onChange={(v) => { setPage(1); setSearch(v); }} placeholder="Search name, email or location" />
        <Select
          label="Filter by status"
          value={status}
          onChange={(v) => { setPage(1); setStatus(v); }}
          options={[
            { value: "all", label: "All members" },
            { value: "verified", label: "ID verified" },
            { value: "unverified", label: "Not verified" },
            { value: "suspended", label: "Suspended" },
            { value: "onboarding", label: "Onboarding incomplete" },
          ]}
        />
      </Toolbar>

      <Card>
        <Table head={["Member", "Status", "Skills / swaps", "Balance", "Joined", ""]}>
          {!data ? (
            <LoadingRows colSpan={6} />
          ) : data.rows.length === 0 ? (
            <EmptyRow colSpan={6}>No members match this filter.</EmptyRow>
          ) : (
            data.rows.map((u) => (
              <tr key={u.id} className="hover:bg-slate-50">
                <td className="px-4 py-3">
                  <p className="font-semibold text-slate-900">{u.name}</p>
                  <p className="text-xs text-slate-500">{u.email}</p>
                  {u.location ? <p className="text-xs text-slate-400">{u.location}</p> : null}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {u.status === "suspended" ? <Badge tone="red">Suspended</Badge> : <Badge tone="green">Active</Badge>}
                    {u.idVerified ? <Badge tone="blue">ID verified</Badge> : null}
                    {!u.emailVerified ? <Badge tone="amber">Email unverified</Badge> : null}
                    {!u.onboarded ? <Badge tone="neutral">Onboarding</Badge> : null}
                  </div>
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {u.activeSwaps} active · {u.completedSwaps} completed
                  <p className="text-xs text-slate-400">{u.projects} projects · {u.rating}</p>
                </td>
                <td className="px-4 py-3 font-semibold tabular-nums text-slate-900">{money(u.balance)}</td>
                <td className="px-4 py-3 text-slate-500">{dateOnly(u.createdAt)}</td>
                <td className="px-4 py-3 text-right">
                  <Link href={`/admin/users/${encodeURIComponent(u.id)}`} className="font-semibold text-swapspot-blue hover:underline">
                    Manage
                  </Link>
                </td>
              </tr>
            ))
          )}
        </Table>
        {data ? <Pagination page={data.page} pageSize={data.pageSize} total={data.total} onPage={setPage} /> : null}
      </Card>
    </AdminShell>
  );
}
