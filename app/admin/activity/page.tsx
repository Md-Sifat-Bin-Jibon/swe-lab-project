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
import { adminApi, type ActivityRow, type Paged } from "@/services/adminApi";

const KINDS = [
  "all",
  "proposal",
  "counter",
  "accepted",
  "declined",
  "withdrawn",
  "completed",
  "dispute_filed",
  "dispute_resolved",
  "review",
  "topup",
  "id_verified",
];

const TONE: Record<string, "blue" | "green" | "amber" | "red" | "violet" | "neutral"> = {
  proposal: "blue",
  counter: "amber",
  accepted: "green",
  completed: "green",
  declined: "neutral",
  withdrawn: "neutral",
  dispute_filed: "red",
  dispute_resolved: "amber",
  review: "violet",
  topup: "violet",
  id_verified: "green",
};

export default function AdminActivityPage() {
  const [data, setData] = useState<Paged<ActivityRow> | null>(null);
  const [kind, setKind] = useState("all");
  const [page, setPage] = useState(1);

  const load = useCallback(() => {
    setData(null);
    adminApi.activity({ kind, page }).then(setData).catch(() => setData({ rows: [], total: 0, page: 1, pageSize: 30 }));
  }, [kind, page]);

  useEffect(load, [load]);

  return (
    <AdminShell>
      <PageHeader title="Activity log" subtitle="Everything members do across the platform, newest first." />

      <Toolbar>
        <Select
          label="Event type"
          value={kind}
          onChange={(v) => { setPage(1); setKind(v); }}
          options={KINDS.map((k) => ({ value: k, label: k === "all" ? "All events" : k.replace("_", " ") }))}
        />
      </Toolbar>

      <Card>
        <Table head={["Event", "Member", "Other party", "Details", "When"]}>
          {!data ? (
            <LoadingRows colSpan={5} />
          ) : data.rows.length === 0 ? (
            <EmptyRow colSpan={5}>No events recorded.</EmptyRow>
          ) : (
            data.rows.map((e) => (
              <tr key={e.id} className="hover:bg-slate-50">
                <td className="px-4 py-3">
                  <Badge tone={TONE[e.kind] ?? "neutral"}>{e.kind.replace("_", " ")}</Badge>
                </td>
                <td className="px-4 py-3 font-medium text-slate-800">{e.actor}</td>
                <td className="px-4 py-3 text-slate-600">{e.target ?? "—"}</td>
                <td className="px-4 py-3 text-sm text-slate-500">
                  {e.data?.ownerOffer ? `${e.data.ownerOffer} ⇄ ${e.data.partnerOffer}` : null}
                  {e.data?.amount ? `$${Number(e.data.amount).toFixed(2)}` : null}
                  {e.data?.rating ? `${e.data.rating}★` : null}
                  {e.data?.depositChanged ? ` · escrow $${Number(e.data.depositFrom).toFixed(2)} → $${Number(e.data.depositTo).toFixed(2)}` : null}
                  {e.swapId ? (
                    <Link href={`/admin/swaps?search=${encodeURIComponent(e.swapId)}`} className="ml-2 font-mono text-[11px] text-swapspot-blue hover:underline">
                      {e.swapId.slice(0, 22)}
                    </Link>
                  ) : null}
                </td>
                <td className="px-4 py-3 text-slate-500">{dateTime(e.createdAt)}</td>
              </tr>
            ))
          )}
        </Table>
        {data ? <Pagination page={data.page} pageSize={data.pageSize} total={data.total} onPage={setPage} /> : null}
      </Card>
    </AdminShell>
  );
}
