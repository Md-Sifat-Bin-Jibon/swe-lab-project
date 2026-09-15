import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/auth";
import { getConversationIfMember, setTyping } from "@/lib/chat";
import { getDb } from "@/lib/db";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  const auth = requireUserId(request);
  if ("response" in auth) return auth.response;

  const { id } = await context.params;
  const body = await request.json().catch(() => ({}));
  const isTyping = Boolean(body.isTyping);

  const db = getDb();
  const row = getConversationIfMember(db, id, auth.userId);
  if (!row) {
    return NextResponse.json(
      { error: "Conversation not found." },
      { status: 404 }
    );
  }

  setTyping(db, id, auth.userId, isTyping);
  return NextResponse.json({ ok: true, isTyping });
}
