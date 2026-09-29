import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { counterProposal, getSwapOffers } from "@/lib/swaps";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ id: string }>;
};

/** Body: { youGive, youGet, deadline?, message? } — terms from the caller's point of view. */
export async function POST(request: Request, context: RouteContext) {
  const auth = requireUserId(request);
  if ("response" in auth) return auth.response;

  const { id } = await context.params;
  const body = await request.json().catch(() => ({}));
  const db = getDb();

  const result = counterProposal(db, auth.userId, id, {
    youGive: String(body.youGive ?? ""),
    youGet: String(body.youGet ?? ""),
    deadline: body.deadline ? String(body.deadline) : null,
    deposit:
      body.deposit === undefined || body.deposit === null || body.deposit === ""
        ? undefined
        : Number(body.deposit),
    message: body.message ? String(body.message) : null,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({
    swap: { ...result.swap, history: getSwapOffers(db, id, auth.userId) },
  });
}
