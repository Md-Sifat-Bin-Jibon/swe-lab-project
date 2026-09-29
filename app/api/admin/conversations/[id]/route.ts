import { NextResponse } from "next/server";
import { listMessages } from "@/lib/admin";
import { logAdminAction, requireAdmin } from "@/lib/adminAuth";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

/** Read-only transcript, for moderating reports. */
export async function GET(request: Request, context: RouteContext) {
  const auth = requireAdmin(request);
  if ("response" in auth) return auth.response;
  const { id } = await context.params;
  logAdminAction(auth.db, auth.admin.id, "chat.viewConversation", { type: "conversation", id });
  return NextResponse.json({ messages: listMessages(auth.db, id) });
}
