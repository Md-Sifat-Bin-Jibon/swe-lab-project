import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { formatSwapWithProfile, getParticipantSwap } from "@/lib/swaps";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  const auth = requireUserId(request);
  if ("response" in auth) return auth.response;

  const { id } = await context.params;
  const db = getDb();
  const row = getParticipantSwap(db, id, auth.userId);

  if (!row) {
    return NextResponse.json({ error: "Swap not found." }, { status: 404 });
  }

  return NextResponse.json({
    swap: formatSwapWithProfile(db, row, auth.userId),
  });
}
