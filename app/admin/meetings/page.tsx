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
  PageHeader,
  Pagination,
  Select,
  Table,
  Toolbar,
} from "@/features/admin/ui";
import { adminApi, type AdminMeetingRow, type Paged } from "@/services/adminApi";

const STATUS_TONE: Record<string, "amber" | "green" | "neutral" | "red"> = {
  pending: "amber",
  accepted: "green",
  declined: "neutral",
  cancelled: "red",
};

export default function AdminMeetingsPage() {
  const [data, setData] = useState<Paged<AdminMeetingRow> | null>(null);
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);

  const load = useCallback(() => {
    setData(null);
    adminApi.meetings({ status, page }).then(setData).catch(() => setData({ rows: [], total: 0, page: 1, pageSize: 25 }));
  }, [status, page]);

  useEffect(load, [load]);

  return (
    <AdminShell>
      <PageHeader title="Meetings" subtitle="Video calls members scheduled through SwapSpot." />

      <Toolbar>
        <Select
          label="Filter"
          value={status}
          onChange={(v) => { setPage(1); setStatus(v); }}
          options={[
            { value: "all", label: "All meetings" },
            { value: "upcoming", label: "Upcoming" },
            { value: "pending", label: "Awaiting response" },
            { value: "accepted", label: "Accepted" },
            { value: "declined", label: "Declined" },
            { value: "cancelled", label: "Cancelled" },
          ]}
        />
      </Toolbar>

      <Card>
        <Table head={["Meeting", "Members", "When", "Link", "Status"]}>
          {!data ? (
            <LoadingRows colSpan={5} />
          ) : data.rows.length === 0 ? (
            <EmptyRow colSpan={5}>No meetings scheduled yet.</EmptyRow>
          ) : (
            data.rows.map((m) => (
              <tr key={m.id} className="hover:bg-slate-50">
                <td className="px-4 py-3">
                  <p className="font-semibold text-slate-900">{m.title}</p>
                  {m.swapId ? (
                    <Link href={`/admin/swaps?search=${encodeURIComponent(m.swapId)}`} className="font-mono text-[11px] text-swapspot-blue hover:underline">
                      {m.swapId.slice(0, 24)}
                    </Link>
                  ) : null}
                </td>
                <td className="px-4 py-3 text-slate-700">
                  {m.organizer.name} <span className="text-slate-400">invited</span> {m.invitee.name}
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {dateTime(m.startsAt)}
                  <p className="text-xs text-slate-400">{m.durationMinutes} min</p>
                </td>
                <td className="px-4 py-3">
                  <Badge tone={m.provider === "google_meet" ? "blue" : "neutral"}>
                    {m.provider === "google_meet" ? "Google Meet" : "SwapSpot room"}
                  </Badge>
                  {m.linkError ? <p className="mt-1 max-w-xs text-xs text-amber-600">{m.linkError}</p> : null}
                </td>
                <td className="px-4 py-3">
                  <Badge tone={STATUS_TONE[m.status] ?? "neutral"}>{m.status}</Badge>
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
