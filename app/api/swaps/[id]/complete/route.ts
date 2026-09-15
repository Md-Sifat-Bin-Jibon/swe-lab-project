import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { markSwapCompleted } from "@/lib/swaps";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  const auth = requireUserId(request);
  if ("response" in auth) return auth.response;

  const { id } = await context.params;
  const db = getDb();
  const payload = markSwapCompleted(db, auth.userId, id);

  if (!payload) {
    return NextResponse.json(
      { error: "Ongoing swap not found." },
      { status: 404 }
    );
  }

  return NextResponse.json(payload);
}
