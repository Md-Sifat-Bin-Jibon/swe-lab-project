"use client";

import { useEffect, useRef, useState } from "react";
import type { ChatMessage, MessageReaction } from "@/types";

const REACTION_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🙏"] as const;

function ReactionBar({
  reactions = [],
  onReact,
}: {
  reactions?: MessageReaction[];
  onReact?: (emoji: string) => void;
}) {
  if (!reactions.length) return null;

  return (
    <div className="mt-1 flex flex-wrap items-center gap-1">
      {reactions.map((reaction) => (
        <button
          key={reaction.emoji}
          type="button"
          onClick={() => onReact?.(reaction.emoji)}
          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs ring-1 transition ${
            reaction.reactedByMe
              ? "bg-swapspot-blue/10 text-swapspot-blue ring-swapspot-blue/30"
              : "bg-white text-slate-600 ring-slate-200 hover:bg-slate-50"
          }`}
        >
          <span>{reaction.emoji}</span>
          <span>{reaction.count}</span>
        </button>
      ))}
    </div>
  );
}

function ReactionPicker({
  align,
  onPick,
}: {
  align: "left" | "right";
  onPick: (emoji: string) => void;
}) {
  return (
    <div
      className={`mt-1 flex w-max gap-0.5 rounded-full bg-white px-1.5 py-1 shadow-md ring-1 ring-slate-200 ${
        align === "right" ? "ml-auto" : ""
      }`}
      role="toolbar"
      aria-label="Message reactions"
    >
      {REACTION_EMOJIS.map((emoji) => (
        <button
          key={emoji}
          type="button"
          className="rounded-full px-1.5 py-0.5 text-sm transition hover:scale-125 hover:bg-slate-50"
          // pointerdown fires before any mouseleave/blur that used to close the picker
          onPointerDown={(event) => {
            event.preventDefault();
            event.stopPropagation();
            onPick(emoji);
          }}
          aria-label={`React with ${emoji}`}
        >
          {emoji}
        </button>
      ))}
    </div>
  );
}

function MessageBody({
  message,
  outgoing,
}: {
  message: ChatMessage;
  outgoing: boolean;
}) {
  const bubble = outgoing
    ? "rounded-2xl rounded-tr-sm bg-swapspot-blue px-4 py-3 text-sm text-white"
    : "rounded-2xl rounded-tl-sm bg-white px-4 py-3 text-sm text-slate-700 shadow-sm ring-1 ring-slate-100";

  if (message.message_type === "image" && message.mediaUrl) {
    return (
      <div className={bubble}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={message.mediaUrl}
          alt={message.text || "Shared photo"}
          className="max-h-64 max-w-full rounded-xl object-cover"
        />
        {message.text && message.text !== "Photo" ? (
          <p className="mt-2">{message.text}</p>
        ) : null}
      </div>
    );
  }

  if (message.message_type === "voice" && message.mediaUrl) {
    return (
      <div className={bubble}>
        <audio controls preload="metadata" className="max-w-full">
          <source src={message.mediaUrl} />
        </audio>
      </div>
    );
  }

  return (
    <div className={bubble}>
      {message.quote ? (
        <div
          className={`mb-2 rounded-lg border-l-4 px-3 py-2 text-xs ${
            outgoing
              ? "border-white/40 bg-white/10 text-white/80"
              : "border-slate-300 bg-slate-50 text-slate-500"
          }`}
        >
          {message.quote}
        </div>
      ) : null}
      {message.text}
    </div>
  );
}

function MessageBubble({
  message,
  onReact,
}: {
  message: ChatMessage;
  onReact?: (messageId: number, emoji: string) => void;
}) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const outgoing = message.direction === "outgoing";
  const time = message.time_label || "";

  useEffect(() => {
    if (!pickerOpen) return;

    function handlePointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setPickerOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [pickerOpen]);

  return (
    <div
      ref={rootRef}
      className={`group relative flex ${outgoing ? "justify-end" : "justify-start"}`}
    >
      <div className={`max-w-md ${outgoing ? "text-right" : ""}`}>
        <div className="relative inline-block text-left">
          <button
            type="button"
            className="block w-full text-left"
            onDoubleClick={() => {
              if (message.id && onReact) onReact(message.id, "👍");
            }}
            onContextMenu={(event) => {
              if (!onReact || !message.id) return;
              event.preventDefault();
              setPickerOpen(true);
            }}
          >
            <MessageBody message={message} outgoing={outgoing} />
          </button>
          {onReact && message.id ? (
            <button
              type="button"
              className={`absolute -top-2 ${
                outgoing ? "-left-2" : "-right-2"
              } h-7 w-7 items-center justify-center rounded-full bg-white text-sm shadow ring-1 ring-slate-200 ${
                pickerOpen ? "flex" : "hidden group-hover:flex"
              }`}
              aria-label="Add reaction"
              aria-expanded={pickerOpen}
              onClick={(event) => {
                event.stopPropagation();
                setPickerOpen((open) => !open);
              }}
            >
              🙂
            </button>
          ) : null}
        </div>
        {pickerOpen && message.id && onReact ? (
          <ReactionPicker
            align={outgoing ? "right" : "left"}
            onPick={(emoji) => {
              onReact(message.id!, emoji);
              setPickerOpen(false);
            }}
          />
        ) : null}
        <ReactionBar
          reactions={message.reactions}
          onReact={
            message.id && onReact
              ? (emoji) => onReact(message.id!, emoji)
              : undefined
          }
        />
        <p
          className={`mt-1 text-xs text-slate-400 ${
            outgoing ? "flex items-center justify-end gap-1" : ""
          }`}
        >
          {time}
        </p>
      </div>
    </div>
  );
}

function TypingIndicator({ name }: { name: string }) {
  return (
    <div className="flex justify-start" aria-live="polite">
      <div className="rounded-2xl rounded-tl-sm bg-white px-4 py-3 shadow-sm ring-1 ring-slate-100">
        <div className="flex items-center gap-1.5">
          <span className="typing-dot h-2 w-2 rounded-full bg-slate-400" />
          <span className="typing-dot h-2 w-2 rounded-full bg-slate-400" />
          <span className="typing-dot h-2 w-2 rounded-full bg-slate-400" />
        </div>
        <p className="mt-1 text-[10px] text-slate-400">{name} is typing…</p>
      </div>
    </div>
  );
}

export interface ChatMessagesProps {
  messages?: ChatMessage[];
  loading?: boolean;
  error?: string | null;
  partnerTyping?: boolean;
  partnerName?: string;
  onReact?: (messageId: number, emoji: string) => void;
}

export function ChatMessages({
  messages = [],
  loading = false,
  error = null,
  partnerTyping = false,
  partnerName = "Partner",
  onReact,
}: ChatMessagesProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, partnerTyping]);

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center bg-slate-50 py-16">
        <svg
          className="h-6 w-6 animate-spin text-swapspot-blue"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 bg-slate-50 px-4 py-6 lg:px-6">
        <p className="py-16 text-center text-sm text-rose-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 overflow-y-auto bg-slate-50 px-4 py-6 lg:px-6">
      {messages.length > 0 ? (
        messages.map((message, index) => {
          const key =
            message.id ?? `${message.direction}-${index}-${message.text}`;
          return (
            <MessageBubble key={key} message={message} onReact={onReact} />
          );
        })
      ) : (
        <p className="text-center text-sm text-slate-400">No messages yet.</p>
      )}
      {partnerTyping ? <TypingIndicator name={partnerName} /> : null}
      <div ref={bottomRef} />
    </div>
  );
}
