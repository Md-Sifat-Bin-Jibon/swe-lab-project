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
import { adminApi, type FlagRow, type Paged } from "@/services/adminApi";

const KIND_TONE: Record<string, "red" | "amber" | "violet" | "blue" | "neutral"> = {
  email: "red",
  phone: "red",
  link: "amber",
  handle: "violet",
  other: "neutral",
};

export default function AdminModerationPage() {
  const [data, setData] = useState<Paged<FlagRow> | null>(null);
  const [kind, setKind] = useState("all");
  const [page, setPage] = useState(1);

  const load = useCallback(() => {
    setData(null);
    adminApi.moderation({ kind, page }).then(setData).catch(() => setData({ rows: [], total: 0, page: 1, pageSize: 30 }));
  }, [kind, page]);

  useEffect(load, [load]);

  return (
    <AdminShell>
      <PageHeader
        title="Moderation"
        subtitle="Contact details and outside links that were automatically removed from member messages."
      />

      <Toolbar>
        <Select
          label="Filter by type"
          value={kind}
          onChange={(v) => { setPage(1); setKind(v); }}
          options={[
            { value: "all", label: "All types" },
            { value: "email", label: "Email addresses" },
            { value: "phone", label: "Phone numbers" },
            { value: "link", label: "Outside links" },
            { value: "handle", label: "Messaging handles" },
            { value: "other", label: "Other" },
          ]}
        />
      </Toolbar>

      <Card>
        <Table head={["Member", "Type", "Removed text", "Caught by", "When"]}>
          {!data ? (
            <LoadingRows colSpan={5} />
          ) : data.rows.length === 0 ? (
            <EmptyRow colSpan={5}>Nothing has been flagged yet.</EmptyRow>
          ) : (
            data.rows.map((f) => (
              <tr key={f.id} className="hover:bg-slate-50">
                <td className="px-4 py-3">
                  <Link href={`/admin/users/${encodeURIComponent(f.user.id)}`} className="font-semibold text-slate-900 hover:text-swapspot-blue">
                    {f.user.name}
                  </Link>
                  <p className="text-xs text-slate-500">{f.user.email}</p>
                </td>
                <td className="px-4 py-3">
                  <Badge tone={KIND_TONE[f.kind] ?? "neutral"}>{f.kind}</Badge>
                  <p className="mt-1 text-xs text-slate-400">{f.context}</p>
                </td>
                <td className="max-w-sm px-4 py-3">
                  <code className="block truncate rounded bg-rose-50 px-2 py-1 text-xs text-rose-700">{f.excerpt}</code>
                  {f.originalText ? <p className="mt-1 line-clamp-2 text-xs text-slate-400">in: {f.originalText}</p> : null}
                </td>
                <td className="px-4 py-3">
                  <Badge tone={f.source === "ai" ? "violet" : "neutral"}>{f.source === "ai" ? "AI check" : "Rules"}</Badge>
                </td>
                <td className="px-4 py-3 text-slate-500">
                  {dateTime(f.createdAt)}
                  {f.conversationId ? (
                    <Link href="/admin/chat" className="mt-1 block text-xs font-semibold text-swapspot-blue hover:underline">
                      Open chat
                    </Link>
                  ) : null}
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
