import { NextResponse } from "next/server";
import { listConversations } from "@/lib/admin";
import { requireAdmin } from "@/lib/adminAuth";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const auth = requireAdmin(request);
  if ("response" in auth) return auth.response;
  const search = new URL(request.url).searchParams.get("search") ?? "";
  return NextResponse.json({ conversations: listConversations(auth.db, search) });
}
