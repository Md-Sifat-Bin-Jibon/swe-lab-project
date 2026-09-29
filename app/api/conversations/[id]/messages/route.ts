import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/auth";
import {
  getConversationIfMember,
  listConversations,
  listMessages,
  markConversationRead,
  sendMessage,
} from "@/lib/chat";
import { getDb } from "@/lib/db";
import { describeFindings, moderateText, recordFlags } from "@/lib/moderation";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  const auth = requireUserId(request);
  if ("response" in auth) return auth.response;

  const { id } = await context.params;
  const db = getDb();
  const row = getConversationIfMember(db, id, auth.userId);

  if (!row) {
    return NextResponse.json(
      { error: "Conversation not found." },
      { status: 404 }
    );
  }

  markConversationRead(db, id, auth.userId);

  const url = new URL(request.url);
  const afterId = Number(url.searchParams.get("after") || 0);

  let messages = listMessages(db, id, auth.userId);
  if (afterId > 0) {
    messages = messages.filter((m) => (m.id ?? 0) > afterId);
  }

  const conversations = listConversations(db, auth.userId, id);
  const conversation = conversations.find((c) => c.id === id) ?? null;

  return NextResponse.json({ conversation, messages });
}

export async function POST(request: Request, context: RouteContext) {
  const auth = requireUserId(request);
  if ("response" in auth) return auth.response;

  const { id } = await context.params;
  const body = await request.json().catch(() => ({}));
  const text = String(body.text || "");
  const messageType = String(body.messageType || "text") as
    | "text"
    | "image"
    | "voice";
  const mediaUrl = body.mediaUrl ? String(body.mediaUrl) : null;

  if (messageType === "text" && !text.trim()) {
    return NextResponse.json(
      { error: "Message text is required." },
      { status: 400 }
    );
  }

  const db = getDb();
  const row = getConversationIfMember(db, id, auth.userId);
  if (!row) {
    return NextResponse.json(
      { error: "Conversation not found." },
      { status: 404 }
    );
  }

  // Strip contact details / off-platform links before the message is stored.
  let cleanText = text;
  let notice: string | null = null;
  if (text.trim()) {
    const checked = await moderateText(text);
    if (checked.findings.length) {
      if (checked.empty && messageType === "text") {
        recordFlags(db, { userId: auth.userId, conversationId: id, originalText: text }, checked.findings);
        return NextResponse.json(
          { error: describeFindings(checked.findings), blocked: true, findings: checked.findings.map((f) => f.kind) },
          { status: 422 }
        );
      }
      cleanText = checked.text;
      notice = describeFindings(checked.findings);
    }
  }

  const message = sendMessage(db, id, auth.userId, {
    text: cleanText,
    messageType: messageType === "image" || messageType === "voice"
      ? messageType
      : "text",
    mediaUrl,
  });
  if (!message) {
    return NextResponse.json(
      { error: "Could not send message." },
      { status: 400 }
    );
  }

  if (notice) {
    const checked = await moderateText(text, { useAi: false });
    recordFlags(
      db,
      { userId: auth.userId, conversationId: id, messageId: message.id ?? null, originalText: text },
      checked.findings.length ? checked.findings : [{ kind: "other", excerpt: text.slice(0, 120), source: "ai" }]
    );
  }

  return NextResponse.json({ message, notice }, { status: 201 });
}
