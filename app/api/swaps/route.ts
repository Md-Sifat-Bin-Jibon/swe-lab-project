import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { getSwapsPayload } from "@/lib/swaps";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const auth = requireUserId(request);
  if ("response" in auth) return auth.response;

  const db = getDb();
  return NextResponse.json(getSwapsPayload(db, auth.userId));
}
