import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/auth";
import { getConversationIfMember, toggleReaction } from "@/lib/chat";
import { getDb } from "@/lib/db";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ id: string; messageId: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  const auth = requireUserId(request);
  if ("response" in auth) return auth.response;

  const { id, messageId: messageIdRaw } = await context.params;
  const messageId = Number(messageIdRaw);
  if (!Number.isFinite(messageId) || messageId <= 0) {
    return NextResponse.json({ error: "Invalid message." }, { status: 400 });
  }

  const body = await request.json().catch(() => ({}));
  const emoji = String(body.emoji || "").trim();
  if (!emoji) {
    return NextResponse.json({ error: "Emoji is required." }, { status: 400 });
  }

  const db = getDb();
  const row = getConversationIfMember(db, id, auth.userId);
  if (!row) {
    return NextResponse.json(
      { error: "Conversation not found." },
      { status: 404 }
    );
  }

  const message = toggleReaction(db, id, messageId, auth.userId, emoji);
  if (!message) {
    return NextResponse.json(
      { error: "Could not update reaction." },
      { status: 400 }
    );
  }

  return NextResponse.json({ message });
}
