import { NextResponse } from "next/server";
import { listMeetingsAdmin } from "@/lib/admin";
import { requireAdmin } from "@/lib/adminAuth";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const auth = requireAdmin(request);
  if ("response" in auth) return auth.response;
  const p = new URL(request.url).searchParams;
  return NextResponse.json(
    listMeetingsAdmin(auth.db, { status: p.get("status") ?? "all", page: Number(p.get("page") ?? 1), pageSize: Number(p.get("pageSize") ?? 25) })
  );
}
