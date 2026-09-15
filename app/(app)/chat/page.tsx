"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { PageLoading } from "@/components/shared/PageLoading";
import { AppHeader } from "@/features/shared/AppHeader";
import { ChatInbox } from "@/features/chat/ChatInbox";
import {
  fetchConversationMessages,
  fetchConversations,
  fetchDashboard,
  getCachedUser,
  openConversation,
  reactToMessage,
  sendConversationMedia,
  sendConversationMessage,
  setConversationTyping,
} from "@/services/api";
import type { ChatMessage, Conversation, SessionUser } from "@/types";

const POLL_MS = 2000;

function ChatPageContent() {
  const searchParams = useSearchParams();
  const withPartnerId = searchParams.get("with") || "";

  const [cached, setCached] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [shellUser, setShellUser] = useState<SessionUser | null>(null);
  const [searchPlaceholder, setSearchPlaceholder] = useState("Search matches…");
  const [unreadCount, setUnreadCount] = useState(0);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [messagesError, setMessagesError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const activeIdRef = useRef<string | null>(null);

  useEffect(() => {
    activeIdRef.current = activeId;
  }, [activeId]);

  useEffect(() => {
    setCached(getCachedUser());
  }, []);

  const refreshInbox = useCallback(async (preferredActive?: string | null) => {
    const inbox = await fetchConversations();
    const list = inbox.conversations ?? [];
    const nextActive =
      preferredActive ||
      activeIdRef.current ||
      list.find((c) => c.active)?.id ||
      list[0]?.id ||
      null;

    setConversations(
      list.map((c) => ({ ...c, active: c.id === nextActive }))
    );
    return { list, nextActive };
  }, []);

  const loadThread = useCallback(async (id: string, quiet = false) => {
    if (!quiet) {
      setLoadingMessages(true);
      setMessagesError(null);
    }
    try {
      const thread = await fetchConversationMessages(id);
      setMessages(thread.messages ?? []);
      if (thread.conversation) {
        setConversations((prev) => {
          const others = prev.filter((c) => c.id !== thread.conversation!.id);
          return [
            { ...thread.conversation!, active: true },
            ...others.map((c) => ({ ...c, active: false })),
          ];
        });
      }
    } catch {
      if (!quiet) {
        setMessages([]);
        setMessagesError("Could not load messages. Try again.");
      }
    } finally {
      if (!quiet) setLoadingMessages(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function boot() {
      setLoading(true);
      setError(null);
      try {
        const shell = await fetchDashboard();
        if (cancelled) return;
        setShellUser(shell.user);
        setSearchPlaceholder(shell.searchPlaceholder);
        setUnreadCount(shell.unreadCount);

        let preferred: string | null = null;
        if (withPartnerId) {
          const opened = await openConversation(withPartnerId);
          preferred = opened.conversation?.id ?? null;
          if (!cancelled && opened.conversations) {
            setConversations(
              opened.conversations.map((c) => ({
                ...c,
                active: c.id === preferred,
              }))
            );
          }
        }

        const { nextActive } = await refreshInbox(preferred);
        if (cancelled) return;

        if (nextActive) {
          setActiveId(nextActive);
          await loadThread(nextActive);
        }
      } catch {
        if (!cancelled) setError("Failed to load the chat page.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void boot();
    return () => {
      cancelled = true;
    };
  }, [withPartnerId, refreshInbox, loadThread]);

  // Near-realtime: poll active thread + inbox (keeps typing/reactions in sync).
  useEffect(() => {
    const timer = window.setInterval(() => {
      void (async () => {
        try {
          const id = activeIdRef.current;
          const inbox = await fetchConversations();
          setConversations(
            (inbox.conversations ?? []).map((c) => ({
              ...c,
              active: c.id === id,
            }))
          );

          if (!id) return;
          await loadThread(id, true);
        } catch {
          // Keep silent during background poll failures.
        }
      })();
    }, POLL_MS);

    return () => window.clearInterval(timer);
  }, [loadThread]);

  const onSelectConversation = useCallback(
    async (id: string) => {
      if (id === activeId) return;
      if (activeId) {
        void setConversationTyping(activeId, false).catch(() => undefined);
      }
      setActiveId(id);
      setConversations((prev) =>
        prev.map((c) => ({ ...c, active: c.id === id }))
      );
      await loadThread(id);
    },
    [activeId, loadThread]
  );

  const onSend = useCallback(
    async (text: string) => {
      if (!activeId) return;
      setSending(true);
      try {
        void setConversationTyping(activeId, false).catch(() => undefined);
        const { message } = await sendConversationMessage(activeId, text);
        setMessages((prev) => [...prev, message]);
        setConversations((prev) =>
          prev.map((c) =>
            c.id === activeId
              ? {
                  ...c,
                  preview: message.text,
                  time: "Today",
                  active: true,
                  partnerTyping: false,
                }
              : c
          )
        );
      } catch {
        setMessagesError("Could not send message. Try again.");
      } finally {
        setSending(false);
      }
    },
    [activeId]
  );

  const onTyping = useCallback(
    (isTyping: boolean) => {
      if (!activeId) return;
      void setConversationTyping(activeId, isTyping).catch(() => undefined);
    },
    [activeId]
  );

  const onSendMedia = useCallback(
    async (file: File) => {
      if (!activeId) return;
      setSending(true);
      try {
        const { message } = await sendConversationMedia(activeId, file);
        setMessages((prev) => [...prev, message]);
        setConversations((prev) =>
          prev.map((c) =>
            c.id === activeId
              ? {
                  ...c,
                  preview:
                    message.message_type === "image"
                      ? "📷 Photo"
                      : "🎤 Voice message",
                  time: "Today",
                  active: true,
                }
              : c
          )
        );
      } catch (err) {
        const detail =
          err instanceof Error && err.message
            ? err.message
            : "Could not send media. Try again.";
        setMessagesError(detail);
      } finally {
        setSending(false);
      }
    },
    [activeId]
  );

  const onReact = useCallback(
    async (messageId: number, emoji: string) => {
      if (!activeId) return;
      try {
        const { message } = await reactToMessage(activeId, messageId, emoji);
        setMessages((prev) =>
          prev.map((m) => (m.id === message.id ? message : m))
        );
      } catch {
        // Ignore reaction failures quietly.
      }
    },
    [activeId]
  );

  if (loading) {
    return <PageLoading title="Loading inbox…" embedded />;
  }

  if (error && conversations.length === 0) {
    return (
      <main className="flex-1 p-6 lg:p-8">
        <p className="text-sm text-rose-600">{error}</p>
      </main>
    );
  }

  const activeConversation =
    conversations.find((c) => c.id === activeId) ?? null;

  return (
    <>
      <AppHeader
        user={{
          avatar: shellUser?.avatar || cached?.avatar || "",
          firstName: shellUser?.firstName || cached?.firstName || "Member",
        }}
        searchPlaceholder={searchPlaceholder}
        unreadCount={unreadCount}
      />

      <main className="flex-1 overflow-auto p-6 lg:p-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Inbox</h1>
            <p className="mt-1 text-sm text-slate-500">
              Typing, photos, voice notes, and reactions update live while this
              page is open.
            </p>
          </div>
        </div>
        <ChatInbox
          conversations={conversations}
          activeConversation={activeConversation}
          messages={messages}
          loadingMessages={loadingMessages}
          messagesError={messagesError}
          sending={sending}
          onSelectConversation={onSelectConversation}
          onSend={onSend}
          onTyping={onTyping}
          onSendImage={onSendMedia}
          onSendVoice={onSendMedia}
          onReact={onReact}
        />
      </main>
    </>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={<PageLoading title="Loading inbox…" embedded />}>
      <ChatPageContent />
    </Suspense>
  );
}
