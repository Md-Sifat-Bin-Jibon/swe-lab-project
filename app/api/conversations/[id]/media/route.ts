import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/auth";
import { getConversationIfMember, sendMessage } from "@/lib/chat";
import { saveChatUpload } from "@/lib/chatUpload";
import { getDb } from "@/lib/db";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, context: RouteContext) {
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

  const form = await request.formData().catch(() => null);
  if (!form) {
    return NextResponse.json({ error: "Invalid upload." }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "File is required." }, { status: 400 });
  }

  const caption = String(form.get("caption") || "").trim();
  const saved = await saveChatUpload(file);
  if ("error" in saved) {
    return NextResponse.json({ error: saved.error }, { status: saved.status });
  }

  const message = sendMessage(db, id, auth.userId, {
    text: caption,
    messageType: saved.kind,
    mediaUrl: saved.url,
  });

  if (!message) {
    return NextResponse.json(
      { error: "Could not send media message." },
      { status: 400 }
    );
  }

  return NextResponse.json({ message }, { status: 201 });
}
