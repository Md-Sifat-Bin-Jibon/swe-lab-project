import { NextResponse } from "next/server";
import { requireAdmin, toAdminUser } from "@/lib/adminAuth";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const auth = requireAdmin(request);
  if ("response" in auth) return auth.response;
  return NextResponse.json({ admin: toAdminUser(auth.admin) });
}
