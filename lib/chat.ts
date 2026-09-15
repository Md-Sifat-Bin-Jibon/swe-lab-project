import type { DatabaseSync } from "node:sqlite";
import { firstNameFrom, type UserRow } from "@/lib/format";
import type { ChatMessage, Conversation, MessageReaction } from "@/types";

const TYPING_WINDOW_MS = 4000;

export type ConversationRow = {
  id: string;
  user_one_id: string | null;
  user_two_id: string | null;
  last_message: string | null;
  updated_at: string | null;
  unread_one: number | null;
  unread_two: number | null;
  preview: string | null;
  time_label: string | null;
  typing_one_at: string | null;
  typing_two_at: string | null;
};

export type MessageRow = {
  id: number;
  conversation_id: string;
  sender_id: string | null;
  direction: string | null;
  text: string;
  time_label: string | null;
  quote: string | null;
  message_type: string | null;
  media_url: string | null;
  created_at: string;
};

function loadUser(db: DatabaseSync, userId: string): UserRow | undefined {
  return db.prepare("SELECT * FROM users WHERE id = ?").get(userId) as
    | UserRow
    | undefined;
}

/** Stable pair ordering so each duo has one conversation. */
export function orderedPair(
  a: string,
  b: string
): { userOne: string; userTwo: string } {
  return a < b ? { userOne: a, userTwo: b } : { userOne: b, userTwo: a };
}

export function conversationIdFor(a: string, b: string): string {
  const { userOne, userTwo } = orderedPair(a, b);
  return `chat-${userOne}-${userTwo}`;
}

function formatClock(iso: string | null | undefined): string {
  if (!iso) return "";
  const date = new Date(iso.includes("T") ? iso : iso.replace(" ", "T") + "Z");
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatDayLabel(iso: string | null | undefined): string {
  if (!iso) return "";
  const date = new Date(iso.includes("T") ? iso : iso.replace(" ", "T") + "Z");
  if (Number.isNaN(date.getTime())) return iso;
  const today = new Date();
  if (date.toDateString() === today.toDateString()) return "Today";
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function initialsFrom(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

function parseIso(iso: string | null | undefined): number {
  if (!iso) return 0;
  const date = new Date(iso.includes("T") ? iso : iso.replace(" ", "T") + "Z");
  return Number.isNaN(date.getTime()) ? 0 : date.getTime();
}

function isTypingActive(iso: string | null | undefined): boolean {
  const ts = parseIso(iso);
  if (!ts) return false;
  return Date.now() - ts < TYPING_WINDOW_MS;
}

function previewForMessage(
  messageType: string,
  text: string
): string {
  if (messageType === "image") return "📷 Photo";
  if (messageType === "voice") return "🎤 Voice message";
  return text;
}

export function getOrCreateConversation(
  db: DatabaseSync,
  userId: string,
  partnerId: string
): ConversationRow | null {
  if (!userId || !partnerId || userId === partnerId) return null;

  const partner = loadUser(db, partnerId);
  if (!partner) return null;

  const { userOne, userTwo } = orderedPair(userId, partnerId);
  const id = conversationIdFor(userId, partnerId);

  const existing = db
    .prepare("SELECT * FROM conversations WHERE id = ?")
    .get(id) as ConversationRow | undefined;

  if (existing?.user_one_id && existing?.user_two_id) {
    return existing;
  }

  const partnerName = partner.full_name || "Member";

  // Legacy columns owner_id / participant_name remain NOT NULL on existing DBs.
  db.prepare(
    `INSERT INTO conversations (
      id, owner_id, participant_name, participant_avatar, participant_initials,
      user_one_id, user_two_id, last_message, updated_at,
      unread, unread_one, unread_two, preview, time_label, online, is_active
    ) VALUES (?, ?, ?, ?, ?, ?, ?, '', datetime('now'), 0, 0, 0, '', '', 1, 0)
    ON CONFLICT(id) DO UPDATE SET
      user_one_id = excluded.user_one_id,
      user_two_id = excluded.user_two_id,
      owner_id = COALESCE(conversations.owner_id, excluded.owner_id),
      participant_name = COALESCE(NULLIF(conversations.participant_name, ''), excluded.participant_name)`
  ).run(
    id,
    userId,
    partnerName,
    partner.avatar ||
      `https://i.pravatar.cc/80?u=${encodeURIComponent(partner.id)}`,
    null,
    userOne,
    userTwo
  );

  return db.prepare("SELECT * FROM conversations WHERE id = ?").get(id) as
    | ConversationRow
    | undefined ?? null;
}

export function listConversations(
  db: DatabaseSync,
  userId: string,
  activeId?: string | null
): Conversation[] {
  const rows = db
    .prepare(
      `SELECT * FROM conversations
       WHERE user_one_id = ? OR user_two_id = ?
       ORDER BY datetime(COALESCE(updated_at, '1970-01-01')) DESC, rowid DESC`
    )
    .all(userId, userId) as ConversationRow[];

  return rows
    .map((row) => formatConversationForUser(db, row, userId, activeId))
    .filter((c): c is Conversation => Boolean(c));
}

function formatConversationForUser(
  db: DatabaseSync,
  row: ConversationRow,
  viewerId: string,
  activeId?: string | null
): Conversation | null {
  if (!row.user_one_id || !row.user_two_id) return null;

  const partnerId =
    row.user_one_id === viewerId ? row.user_two_id : row.user_one_id;
  const partner = loadUser(db, partnerId);
  if (!partner) return null;

  const name = partner.full_name || "Member";
  const isOne = row.user_one_id === viewerId;
  const unread = isOne ? Number(row.unread_one ?? 0) : Number(row.unread_two ?? 0);
  const preview = row.last_message || row.preview || "";
  const updated = row.updated_at;
  const partnerTyping = isOne
    ? isTypingActive(row.typing_two_at)
    : isTypingActive(row.typing_one_at);

  return {
    id: row.id,
    partnerId,
    name,
    avatar:
      partner.avatar ||
      `https://i.pravatar.cc/80?u=${encodeURIComponent(partner.id)}`,
    initials: initialsFrom(name),
    preview: partnerTyping ? "Typing…" : preview,
    time: formatDayLabel(updated) || row.time_label || "",
    unread,
    online: Boolean(partner.available),
    active: activeId ? row.id === activeId : false,
    partnerTyping,
  };
}

export function getConversationIfMember(
  db: DatabaseSync,
  conversationId: string,
  userId: string
): ConversationRow | null {
  const row = db
    .prepare(
      `SELECT * FROM conversations
       WHERE id = ? AND (user_one_id = ? OR user_two_id = ?)`
    )
    .get(conversationId, userId, userId) as ConversationRow | undefined;
  return row ?? null;
}

function loadReactionsForMessages(
  db: DatabaseSync,
  messageIds: number[],
  viewerId: string
): Map<number, MessageReaction[]> {
  const map = new Map<number, MessageReaction[]>();
  if (messageIds.length === 0) return map;

  const placeholders = messageIds.map(() => "?").join(",");
  const rows = db
    .prepare(
      `SELECT message_id, emoji, user_id
       FROM message_reactions
       WHERE message_id IN (${placeholders})
       ORDER BY id ASC`
    )
    .all(...messageIds) as Array<{
    message_id: number;
    emoji: string;
    user_id: string;
  }>;

  const buckets = new Map<
    string,
    { messageId: number; emoji: string; count: number; reactedByMe: boolean }
  >();

  for (const row of rows) {
    const key = `${row.message_id}:${row.emoji}`;
    const existing = buckets.get(key);
    if (existing) {
      existing.count += 1;
      if (row.user_id === viewerId) existing.reactedByMe = true;
    } else {
      buckets.set(key, {
        messageId: row.message_id,
        emoji: row.emoji,
        count: 1,
        reactedByMe: row.user_id === viewerId,
      });
    }
  }

  for (const entry of buckets.values()) {
    const list = map.get(entry.messageId) ?? [];
    list.push({
      emoji: entry.emoji,
      count: entry.count,
      reactedByMe: entry.reactedByMe,
    });
    map.set(entry.messageId, list);
  }

  return map;
}

function formatMessage(
  row: MessageRow,
  viewerId: string,
  reactions: MessageReaction[] = []
): ChatMessage {
  const senderId = row.sender_id || "";
  const direction: ChatMessage["direction"] =
    senderId === viewerId ? "outgoing" : "incoming";
  return {
    id: row.id,
    senderId,
    direction,
    text: row.text,
    time_label: row.time_label || formatClock(row.created_at),
    quote: row.quote,
    message_type: row.message_type || "text",
    mediaUrl: row.media_url,
    createdAt: row.created_at,
    reactions,
  };
}

export function listMessages(
  db: DatabaseSync,
  conversationId: string,
  viewerId: string
): ChatMessage[] {
  const rows = db
    .prepare(
      `SELECT * FROM messages
       WHERE conversation_id = ?
       ORDER BY id ASC`
    )
    .all(conversationId) as MessageRow[];

  const reactions = loadReactionsForMessages(
    db,
    rows.map((r) => r.id),
    viewerId
  );

  return rows.map((row) =>
    formatMessage(row, viewerId, reactions.get(row.id) ?? [])
  );
}

export function markConversationRead(
  db: DatabaseSync,
  conversationId: string,
  userId: string
): void {
  const row = getConversationIfMember(db, conversationId, userId);
  if (!row?.user_one_id || !row.user_two_id) return;

  if (row.user_one_id === userId) {
    db.prepare("UPDATE conversations SET unread_one = 0 WHERE id = ?").run(
      conversationId
    );
  } else {
    db.prepare("UPDATE conversations SET unread_two = 0 WHERE id = ?").run(
      conversationId
    );
  }
}

export function setTyping(
  db: DatabaseSync,
  conversationId: string,
  userId: string,
  isTyping: boolean
): boolean {
  const row = getConversationIfMember(db, conversationId, userId);
  if (!row?.user_one_id || !row.user_two_id) return false;

  const value = isTyping ? new Date().toISOString() : null;
  if (row.user_one_id === userId) {
    db.prepare("UPDATE conversations SET typing_one_at = ? WHERE id = ?").run(
      value,
      conversationId
    );
  } else {
    db.prepare("UPDATE conversations SET typing_two_at = ? WHERE id = ?").run(
      value,
      conversationId
    );
  }
  return true;
}

export type SendMessageInput = {
  text?: string;
  messageType?: "text" | "image" | "voice";
  mediaUrl?: string | null;
};

export function sendMessage(
  db: DatabaseSync,
  conversationId: string,
  senderId: string,
  input: string | SendMessageInput
): ChatMessage | null {
  const payload: SendMessageInput =
    typeof input === "string" ? { text: input, messageType: "text" } : input;

  const messageType = payload.messageType || "text";
  const mediaUrl = payload.mediaUrl || null;
  const trimmed = (payload.text || "").trim();

  if (messageType === "text" && !trimmed) return null;
  if ((messageType === "image" || messageType === "voice") && !mediaUrl) {
    return null;
  }

  const row = getConversationIfMember(db, conversationId, senderId);
  if (!row?.user_one_id || !row.user_two_id) return null;

  const now = new Date().toISOString();
  const timeLabel = formatClock(now);
  const text =
    messageType === "text"
      ? trimmed
      : trimmed || (messageType === "image" ? "Photo" : "Voice message");
  const preview = previewForMessage(messageType, text);

  const result = db
    .prepare(
      `INSERT INTO messages (
        conversation_id, sender_id, direction, text, time_label, quote,
        message_type, media_url, created_at
      ) VALUES (?, ?, ?, ?, ?, NULL, ?, ?, ?)`
    )
    .run(
      conversationId,
      senderId,
      "outgoing",
      text,
      timeLabel,
      messageType,
      mediaUrl,
      now
    );

  const isSenderOne = row.user_one_id === senderId;
  if (isSenderOne) {
    db.prepare(
      `UPDATE conversations
       SET last_message = ?, preview = ?, updated_at = ?, time_label = ?,
           unread_two = unread_two + 1, typing_one_at = NULL
       WHERE id = ?`
    ).run(preview, preview, now, formatDayLabel(now), conversationId);
  } else {
    db.prepare(
      `UPDATE conversations
       SET last_message = ?, preview = ?, updated_at = ?, time_label = ?,
           unread_one = unread_one + 1, typing_two_at = NULL
       WHERE id = ?`
    ).run(preview, preview, now, formatDayLabel(now), conversationId);
  }

  return {
    id: Number(result.lastInsertRowid),
    senderId,
    direction: "outgoing",
    text,
    time_label: timeLabel,
    quote: null,
    message_type: messageType,
    mediaUrl,
    createdAt: now,
    reactions: [],
  };
}

export function toggleReaction(
  db: DatabaseSync,
  conversationId: string,
  messageId: number,
  userId: string,
  emoji: string
): ChatMessage | null {
  const conversation = getConversationIfMember(db, conversationId, userId);
  if (!conversation) return null;

  const message = db
    .prepare(
      `SELECT * FROM messages
       WHERE id = ? AND conversation_id = ?`
    )
    .get(messageId, conversationId) as MessageRow | undefined;
  if (!message) return null;

  const cleanEmoji = emoji.trim().slice(0, 16);
  if (!cleanEmoji) return null;

  const existing = db
    .prepare(
      `SELECT id FROM message_reactions
       WHERE message_id = ? AND user_id = ? AND emoji = ?`
    )
    .get(messageId, userId, cleanEmoji) as { id: number } | undefined;

  if (existing) {
    db.prepare("DELETE FROM message_reactions WHERE id = ?").run(existing.id);
  } else {
    // One reaction per user per message (Messenger-like): replace prior emoji.
    db.prepare(
      "DELETE FROM message_reactions WHERE message_id = ? AND user_id = ?"
    ).run(messageId, userId);
    db.prepare(
      `INSERT INTO message_reactions (message_id, user_id, emoji)
       VALUES (?, ?, ?)`
    ).run(messageId, userId, cleanEmoji);
  }

  const reactions = loadReactionsForMessages(db, [messageId], userId);
  return formatMessage(message, userId, reactions.get(messageId) ?? []);
}

export function countUnreadMessages(db: DatabaseSync, userId: string): number {
  const row = db
    .prepare(
      `SELECT
         COALESCE(SUM(CASE WHEN user_one_id = ? THEN unread_one ELSE 0 END), 0)
         + COALESCE(SUM(CASE WHEN user_two_id = ? THEN unread_two ELSE 0 END), 0)
         AS count
       FROM conversations
       WHERE user_one_id = ? OR user_two_id = ?`
    )
    .get(userId, userId, userId, userId) as { count: number };

  return Number(row.count ?? 0);
}

/** Seed a demo↔eric thread for fresh databases. */
export function seedRealtimeChat(db: DatabaseSync, demoId: string): void {
  const eric = loadUser(db, "eric");
  if (!eric) return;

  const conversation = getOrCreateConversation(db, demoId, "eric");
  if (!conversation) return;

  const existing = db
    .prepare(
      "SELECT COUNT(*) AS count FROM messages WHERE conversation_id = ?"
    )
    .get(conversation.id) as { count: number };

  if (existing.count > 0) return;

  sendMessage(
    db,
    conversation.id,
    "eric",
    "Hey! Saw your Web Development skill — interested in a swap?"
  );
  sendMessage(
    db,
    conversation.id,
    demoId,
    `Hi ${firstNameFrom(eric.full_name)}! Yes, let's chat about it.`
  );
}
