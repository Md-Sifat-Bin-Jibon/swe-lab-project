"use client";

import type { Conversation } from "@/types";

export interface ChatConversationItemProps extends Conversation {
  onSelect: (id: string) => void;
}

export function ChatConversationItem({
  id,
  name,
  avatar,
  initials,
  preview,
  time,
  unread = 0,
  online = false,
  active = false,
  onSelect,
}: ChatConversationItemProps) {
  const activeClass = active
    ? "border-l-4 border-swapspot-blue bg-swapspot-blue/10"
    : "border-l-4 border-transparent hover:bg-slate-50";

  return (
    <button
      type="button"
      className={`flex w-full items-center gap-3 px-4 py-4 text-left transition ${activeClass}`}
      aria-current={active ? "true" : "false"}
      onClick={() => onSelect(id)}
    >
      {avatar ? (
        <div className="relative shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={avatar}
            alt={name}
            className="h-12 w-12 rounded-full object-cover"
            width={48}
            height={48}
          />
          {online ? (
            <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-emerald-500" />
          ) : null}
        </div>
      ) : (
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-swapspot-blue text-sm font-bold text-white">
          {initials}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate font-semibold text-slate-900">{name}</span>
          <span className="shrink-0 text-xs text-slate-400">{time}</span>
        </div>
        <div className="mt-1 flex items-center justify-between gap-2">
          <p className="truncate text-sm text-slate-500">{preview}</p>
          {unread > 0 ? (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-swapspot-blue px-1.5 text-xs font-semibold text-white">
              {unread}
            </span>
          ) : null}
        </div>
      </div>
    </button>
  );
}
