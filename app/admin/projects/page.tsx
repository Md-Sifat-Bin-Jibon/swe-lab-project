"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AdminShell } from "@/features/admin/AdminShell";
import { ActionButton, Badge, Card, dateOnly, PageHeader, Pagination, SearchInput, Toolbar } from "@/features/admin/ui";
import { adminApi, type AdminProjectRow, type Paged } from "@/services/adminApi";

export default function AdminProjectsPage() {
  const [data, setData] = useState<Paged<AdminProjectRow> | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(() => {
    setData(null);
    adminApi.projects({ search, page }).then(setData).catch(() => setData({ rows: [], total: 0, page: 1, pageSize: 24 }));
  }, [search, page]);

  useEffect(() => {
    const t = setTimeout(load, search ? 300 : 0);
    return () => clearTimeout(t);
  }, [load, search]);

  async function remove(p: AdminProjectRow) {
    const reason = window.prompt(`Remove "${p.title}" by ${p.owner}? Add a reason for the audit log:`, "");
    if (reason === null) return;
    setBusy(p.id);
    try {
      await adminApi.deleteProject(p.id, reason);
      load();
    } finally {
      setBusy(null);
    }
  }

  return (
    <AdminShell>
      <PageHeader title="Projects" subtitle="Portfolio work published by members. Remove anything that breaks the rules." />

      <Toolbar>
        <SearchInput value={search} onChange={(v) => { setPage(1); setSearch(v); }} placeholder="Search title, description or member" />
      </Toolbar>

      {!data ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-64 animate-pulse rounded-2xl bg-slate-100" />
          ))}
        </div>
      ) : data.rows.length === 0 ? (
        <Card className="p-10 text-center text-slate-500">No projects found.</Card>
      ) : (
        <>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {data.rows.map((p) => (
              <Card key={p.id} className="flex flex-col overflow-hidden">
                <div className="aspect-[16/10] w-full bg-slate-100">
                  {p.images[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.images[0]} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-slate-400">No image</div>
                  )}
                </div>
                <div className="flex flex-1 flex-col p-4">
                  <h3 className="line-clamp-2 font-semibold text-slate-900">{p.title}</h3>
                  <p className="mt-1 text-xs text-slate-500">
                    by{" "}
                    <Link href={`/admin/users/${encodeURIComponent(p.userId)}`} className="font-medium text-swapspot-blue hover:underline">
                      {p.owner}
                    </Link>{" "}
                    · {dateOnly(p.createdAt)}
                  </p>
                  <p className="mt-2 line-clamp-2 text-sm text-slate-500">{p.description}</p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {p.skill ? <Badge tone="blue">{p.skill}</Badge> : null}
                    {p.tags.slice(0, 3).map((t) => (
                      <Badge key={t}>{t}</Badge>
                    ))}
                    {p.images.length > 1 ? <Badge tone="neutral">{p.images.length} images</Badge> : null}
                  </div>
                  <div className="mt-auto flex items-center justify-between gap-2 pt-4">
                    {p.projectUrl ? (
                      <a href={p.projectUrl} target="_blank" rel="noopener noreferrer nofollow" className="text-sm font-semibold text-swapspot-blue hover:underline">
                        Open link ↗
                      </a>
                    ) : (
                      <span />
                    )}
                    <ActionButton tone="danger" disabled={busy === p.id} onClick={() => remove(p)}>
                      Remove
                    </ActionButton>
                  </div>
                </div>
              </Card>
            ))}
          </div>
          <Card className="mt-5">
            <Pagination page={data.page} pageSize={data.pageSize} total={data.total} onPage={setPage} />
          </Card>
        </>
      )}
    </AdminShell>
  );
}
