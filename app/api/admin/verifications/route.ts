import { NextResponse } from "next/server";
import { listVerifications } from "@/lib/admin";
import { requireAdmin } from "@/lib/adminAuth";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const auth = requireAdmin(request);
  if ("response" in auth) return auth.response;
  const status = new URL(request.url).searchParams.get("status") ?? "pending";
  return NextResponse.json({ verifications: listVerifications(auth.db, status) });
}
