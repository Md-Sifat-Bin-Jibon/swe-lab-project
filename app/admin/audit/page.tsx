"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminShell } from "@/features/admin/AdminShell";
import { Badge, Card, dateTime, EmptyRow, LoadingRows, PageHeader, Pagination, Table } from "@/features/admin/ui";
import { adminApi, type AuditRow, type Paged } from "@/services/adminApi";

export default function AdminAuditPage() {
  const [data, setData] = useState<Paged<AuditRow> | null>(null);
  const [page, setPage] = useState(1);

  const load = useCallback(() => {
    setData(null);
    adminApi.audit({ page }).then(setData).catch(() => setData({ rows: [], total: 0, page: 1, pageSize: 30 }));
  }, [page]);

  useEffect(load, [load]);

  return (
    <AdminShell>
      <PageHeader title="Admin audit log" subtitle="Every admin sign-in and action, so changes can always be traced." />

      <Card>
        <Table head={["Admin", "Action", "Target", "Note", "When"]}>
          {!data ? (
            <LoadingRows colSpan={5} />
          ) : data.rows.length === 0 ? (
            <EmptyRow colSpan={5}>No admin actions recorded yet.</EmptyRow>
          ) : (
            data.rows.map((a) => (
              <tr key={a.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-slate-800">{a.admin}</td>
                <td className="px-4 py-3">
                  <Badge tone={a.action.includes("suspend") || a.action.includes("delete") || a.action.includes("reject") ? "red" : a.action.includes("login") ? "neutral" : "blue"}>
                    {a.action}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {a.targetType ?? "—"}
                  {a.targetId ? <p className="font-mono text-[11px] text-slate-400">{a.targetId}</p> : null}
                </td>
                <td className="max-w-sm px-4 py-3 text-sm text-slate-500">{a.detail || "—"}</td>
                <td className="px-4 py-3 text-slate-500">{dateTime(a.createdAt)}</td>
              </tr>
            ))
          )}
        </Table>
        {data ? <Pagination page={data.page} pageSize={data.pageSize} total={data.total} onPage={setPage} /> : null}
      </Card>
    </AdminShell>
  );
}
