"use client";

import type { ChatMessage, Conversation } from "@/types";
import { ChatConversationList } from "@/features/chat/ChatConversationList";
import { ChatWindow } from "@/features/chat/ChatWindow";

export interface ChatInboxProps {
  conversations: Conversation[];
  activeConversation?: Conversation | null;
  messages?: ChatMessage[];
  loadingMessages?: boolean;
  messagesError?: string | null;
  sending?: boolean;
  onSelectConversation: (id: string) => void;
  onSend: (text: string) => Promise<void> | void;
  onTyping?: (isTyping: boolean) => void;
  onSendImage?: (file: File) => Promise<void> | void;
  onSendVoice?: (file: File) => Promise<void> | void;
  onReact?: (messageId: number, emoji: string) => void;
}

export function ChatInbox({
  conversations,
  activeConversation = null,
  messages = [],
  loadingMessages = false,
  messagesError = null,
  sending = false,
  onSelectConversation,
  onSend,
  onTyping,
  onSendImage,
  onSendVoice,
  onReact,
}: ChatInboxProps) {
  return (
    <div className="flex min-h-[640px] overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
      <ChatConversationList
        conversations={conversations}
        onSelect={onSelectConversation}
      />
      <ChatWindow
        conversation={activeConversation}
        messages={messages}
        loadingMessages={loadingMessages}
        messagesError={messagesError}
        sending={sending}
        onSend={onSend}
        onTyping={onTyping}
        onSendImage={onSendImage}
        onSendVoice={onSendVoice}
        onReact={onReact}
      />
    </div>
  );
}
