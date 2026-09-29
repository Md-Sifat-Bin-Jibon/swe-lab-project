"use client";

import Link from "next/link";
import type { ChatMessage, Conversation } from "@/types";
import { ChatMessages } from "@/features/chat/ChatMessages";
import { ChatInput } from "@/features/chat/ChatInput";
import { Avatar } from "@/components/ui/Avatar";

export interface ChatWindowProps {
  conversation?: Conversation | null;
  messages?: ChatMessage[];
  loadingMessages?: boolean;
  messagesError?: string | null;
  sending?: boolean;
  onSend?: (text: string) => Promise<void> | void;
  onTyping?: (isTyping: boolean) => void;
  onSendImage?: (file: File) => Promise<void> | void;
  onSendVoice?: (file: File) => Promise<void> | void;
  onReact?: (messageId: number, emoji: string) => void;
}

export function ChatWindow({
  conversation = null,
  messages = [],
  loadingMessages = false,
  messagesError = null,
  sending = false,
  onSend,
  onTyping,
  onSendImage,
  onSendVoice,
  onReact,
}: ChatWindowProps) {
  const name = conversation?.name ?? "Select a conversation";
  const avatar =
    conversation?.avatar ??
    (conversation?.initials ? "" : "https://i.pravatar.cc/80?u=placeholder");

  return (
    <section
      className="flex min-w-0 flex-1 flex-col bg-white"
      aria-label={`Chat with ${name}`}
    >
      <header className="flex items-center gap-3 border-b border-slate-200 px-4 py-3 lg:px-6">
        {conversation?.initials && !conversation.avatar ? (
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-swapspot-blue/10 text-sm font-semibold text-swapspot-blue">
            {conversation.initials}
          </div>
        ) : (
          <Avatar src={avatar} name={name} size={40} className="rounded-full" />
        )}
        <div className="min-w-0 flex-1">
          <h2 className="truncate font-semibold text-slate-900">{name}</h2>
          {conversation ? (
            <p
              className={`text-xs ${
                conversation.partnerTyping
                  ? "text-swapspot-blue"
                  : "text-emerald-600"
              }`}
            >
              {conversation.partnerTyping
                ? "Typing…"
                : conversation.online
                  ? "Available · live"
                  : "Away · live"}
            </p>
          ) : null}
        </div>

        {conversation?.partnerId ? (
          <Link
            href={`/swaps/propose?partnerId=${encodeURIComponent(conversation.partnerId)}`}
            className="rounded-lg bg-swapspot-blue px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#3f52c4]"
          >
            Swap
          </Link>
        ) : null}
      </header>

      <ChatMessages
        messages={messages}
        loading={loadingMessages}
        error={messagesError}
        partnerTyping={Boolean(conversation?.partnerTyping)}
        partnerName={conversation?.name?.split(" ")[0] || "Partner"}
        onReact={onReact}
      />
      <ChatInput
        disabled={!conversation || !onSend}
        sending={sending}
        onSend={onSend ?? (async () => undefined)}
        onTyping={onTyping}
        onSendImage={onSendImage}
        onSendVoice={onSendVoice}
      />
    </section>
  );
}
