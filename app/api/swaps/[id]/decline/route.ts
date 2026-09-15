import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { declineProposal } from "@/lib/swaps";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  const auth = requireUserId(request);
  if ("response" in auth) return auth.response;

  const { id } = await context.params;
  const db = getDb();
  const ok = declineProposal(db, auth.userId, id);

  if (!ok) {
    return NextResponse.json(
      { error: "Proposal not found or already handled." },
      { status: 404 }
    );
  }

  return NextResponse.json({ ok: true });
}
