import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { respondToDispute } from "@/lib/swaps";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  const auth = requireUserId(request);
  if ("response" in auth) return auth.response;

  const { id } = await context.params;
  const body = await request.json().catch(() => ({}));
  const responseText = String(body.response || body.responseText || "").trim();

  if (!responseText) {
    return NextResponse.json(
      { error: "Dispute response is required." },
      { status: 400 }
    );
  }

  const db = getDb();
  const swap = respondToDispute(db, auth.userId, id, responseText);

  if (!swap) {
    return NextResponse.json(
      { error: "Dispute swap not found." },
      { status: 404 }
    );
  }

  return NextResponse.json({ swap });
}
