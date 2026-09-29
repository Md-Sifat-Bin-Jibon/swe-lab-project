import { NextResponse } from "next/server";
import { getSystemInfo } from "@/lib/admin";
import { requireAdmin } from "@/lib/adminAuth";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const auth = requireAdmin(request);
  if ("response" in auth) return auth.response;
  return NextResponse.json({ system: getSystemInfo(auth.db) });
}
