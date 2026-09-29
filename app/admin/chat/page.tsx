"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminShell } from "@/features/admin/AdminShell";
import { Card, dateTime, PageHeader, SearchInput, Toolbar } from "@/features/admin/ui";
import { adminApi, type AdminMessage, type ConversationRow } from "@/services/adminApi";

export default function AdminChatPage() {
  const [rows, setRows] = useState<ConversationRow[] | null>(null);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<ConversationRow | null>(null);
  const [messages, setMessages] = useState<AdminMessage[] | null>(null);

  const load = useCallback(() => {
    setRows(null);
    adminApi.conversations(search).then((r) => setRows(r.conversations)).catch(() => setRows([]));
  }, [search]);

  useEffect(() => {
    const t = setTimeout(load, search ? 300 : 0);
    return () => clearTimeout(t);
  }, [load, search]);

  function open(c: ConversationRow) {
    setSelected(c);
    setMessages(null);
    adminApi.messages(c.id).then((r) => setMessages(r.messages)).catch(() => setMessages([]));
  }

  return (
    <AdminShell>
      <PageHeader title="Chat" subtitle="Read-only transcripts for moderating reports. Viewing a conversation is recorded in the audit log." />

      <Toolbar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search member or message text" />
      </Toolbar>

      <div className="grid gap-5 lg:grid-cols-[360px_1fr]">
        <Card className="max-h-[70vh] overflow-y-auto">
          {rows === null ? (
            <div className="space-y-2 p-4">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-14 animate-pulse rounded-lg bg-slate-100" />
              ))}
            </div>
          ) : rows.length === 0 ? (
            <p className="p-8 text-center text-sm text-slate-400">No conversations.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {rows.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => open(c)}
                    className={`w-full px-4 py-3 text-left transition hover:bg-slate-50 ${selected?.id === c.id ? "bg-swapspot-blue/5" : ""}`}
                  >
                    <p className="font-semibold text-slate-900">{c.participants.join(" ↔ ")}</p>
                    <p className="truncate text-xs text-slate-500">{c.lastMessage || "No messages yet"}</p>
                    <p className="mt-0.5 text-[11px] text-slate-400">
                      {c.messageCount} messages · {dateTime(c.updatedAt)}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="max-h-[70vh] overflow-y-auto p-5">
          {!selected ? (
            <p className="py-20 text-center text-sm text-slate-400">Select a conversation to read the transcript.</p>
          ) : messages === null ? (
            <div className="space-y-3">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="h-12 animate-pulse rounded-lg bg-slate-100" />
              ))}
            </div>
          ) : (
            <>
              <h2 className="mb-4 text-base font-bold text-slate-900">{selected.participants.join(" ↔ ")}</h2>
              <ul className="space-y-3">
                {messages.map((m) => (
                  <li key={m.id} className="rounded-xl bg-slate-50 p-3">
                    <p className="text-xs font-semibold text-slate-700">
                      {m.sender} <span className="font-normal text-slate-400">· {dateTime(m.createdAt)}</span>
                    </p>
                    {m.type === "image" && m.mediaUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={m.mediaUrl} alt="Shared" className="mt-2 max-h-56 rounded-lg" />
                    ) : m.type === "voice" && m.mediaUrl ? (
                      <audio controls src={m.mediaUrl} className="mt-2 w-full max-w-sm" />
                    ) : null}
                    {m.text ? <p className="mt-1 whitespace-pre-line text-sm text-slate-700">{m.text}</p> : null}
                  </li>
                ))}
                {messages.length === 0 ? <li className="text-sm text-slate-400">No messages in this conversation.</li> : null}
              </ul>
            </>
          )}
        </Card>
      </div>
    </AdminShell>
  );
}
