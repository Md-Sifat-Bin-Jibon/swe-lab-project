import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { fileDispute } from "@/lib/swaps";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  const auth = requireUserId(request);
  if ("response" in auth) return auth.response;

  const { id } = await context.params;
  const body = await request.json().catch(() => ({}));
  const reason = String(body.reason || body.response || "").trim();

  if (!reason) {
    return NextResponse.json(
      { error: "Dispute reason is required." },
      { status: 400 }
    );
  }

  const db = getDb();
  const swap = fileDispute(db, auth.userId, id, reason);

  if (!swap) {
    return NextResponse.json(
      { error: "Active swap not found or already in dispute." },
      { status: 404 }
    );
  }

  return NextResponse.json({ swap });
}
