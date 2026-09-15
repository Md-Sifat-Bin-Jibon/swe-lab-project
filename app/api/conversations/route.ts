import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/auth";
import {
  getOrCreateConversation,
  listConversations,
} from "@/lib/chat";
import { getDb } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const auth = requireUserId(request);
  if ("response" in auth) return auth.response;

  const url = new URL(request.url);
  const activeId = url.searchParams.get("active");

  const db = getDb();
  return NextResponse.json({
    conversations: listConversations(db, auth.userId, activeId),
  });
}

/** Open or create a 1:1 conversation with a partner. */
export async function POST(request: Request) {
  const auth = requireUserId(request);
  if ("response" in auth) return auth.response;

  const body = await request.json().catch(() => ({}));
  const partnerId = String(body.partnerId || "").trim();

  if (!partnerId) {
    return NextResponse.json(
      { error: "partnerId is required." },
      { status: 400 }
    );
  }

  const db = getDb();
  const row = getOrCreateConversation(db, auth.userId, partnerId);
  if (!row) {
    return NextResponse.json(
      { error: "Partner not found." },
      { status: 404 }
    );
  }

  const conversations = listConversations(db, auth.userId, row.id);
  const conversation = conversations.find((c) => c.id === row.id) ?? null;

  return NextResponse.json({ conversation, conversations }, { status: 201 });
}
