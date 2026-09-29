import { NextResponse } from "next/server";
import { getOverview } from "@/lib/admin";
import { requireAdmin } from "@/lib/adminAuth";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const auth = requireAdmin(request);
  if ("response" in auth) return auth.response;
  return NextResponse.json({ overview: getOverview(auth.db) });
}
