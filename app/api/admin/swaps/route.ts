import { NextResponse } from "next/server";
import { listSwaps } from "@/lib/admin";
import { requireAdmin } from "@/lib/adminAuth";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const auth = requireAdmin(request);
  if ("response" in auth) return auth.response;
  const p = new URL(request.url).searchParams;
  return NextResponse.json(
    listSwaps(auth.db, {
      search: p.get("search") ?? "",
      type: p.get("type") ?? "all",
      page: Number(p.get("page") ?? 1),
      pageSize: Number(p.get("pageSize") ?? 20),
    })
  );
}
