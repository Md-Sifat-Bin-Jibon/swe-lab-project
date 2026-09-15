"use client";

import type { Conversation } from "@/types";
import { ChatConversationItem } from "@/features/chat/ChatConversationItem";

export interface ChatConversationListProps {
  conversations: Conversation[];
  onSelect: (id: string) => void;
}

export function ChatConversationList({
  conversations,
  onSelect,
}: ChatConversationListProps) {
  const totalUnread = conversations.reduce(
    (sum, conversation) => sum + (conversation.unread ?? 0),
    0
  );

  return (
    <aside
      className="flex w-full flex-col border-r border-slate-200 md:w-80 lg:w-96"
      aria-label="Conversations"
    >
      <div className="border-b border-slate-100 px-4 py-3">
        <span className="text-sm font-semibold text-swapspot-blue">
          {totalUnread} unread message{totalUnread === 1 ? "" : "s"}
        </span>
      </div>
      <div className="flex-1 overflow-y-auto">
        {conversations.length > 0 ? (
          conversations.map((convo) => (
            <ChatConversationItem
              key={convo.id}
              {...convo}
              onSelect={onSelect}
            />
          ))
        ) : (
          <p className="p-4 text-sm text-slate-500">No conversations yet.</p>
        )}
      </div>
    </aside>
  );
}
