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

  const message = sendMessage(db, id, auth.userId, {
    text,
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

  return NextResponse.json({ message }, { status: 201 });
}
