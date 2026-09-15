import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { acceptProposal } from "@/lib/swaps";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  const auth = requireUserId(request);
  if ("response" in auth) return auth.response;

  const { id } = await context.params;
  const db = getDb();
  const swap = acceptProposal(db, auth.userId, id);

  if (!swap) {
    return NextResponse.json(
      {
        error:
          "Proposal not found, already handled, or only the recipient can accept.",
      },
      { status: 404 }
    );
  }

  return NextResponse.json({ swap });
}
