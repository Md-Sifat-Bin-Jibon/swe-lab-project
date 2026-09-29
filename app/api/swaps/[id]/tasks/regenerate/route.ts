import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { getParticipantSwap } from "@/lib/swaps";
import { generateSwapTasks, listSwapTasks } from "@/lib/swapTasks";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

/** Rebuild the generated plan for both people (personal tasks are kept). */
export async function POST(request: Request, context: RouteContext) {
  const auth = requireUserId(request);
  if ("response" in auth) return auth.response;

  const { id } = await context.params;
  const db = getDb();
  const row = getParticipantSwap(db, id, auth.userId);
  if (!row || row.type !== "ongoing") {
    return NextResponse.json({ error: "Active swap not found." }, { status: 404 });
  }

  await generateSwapTasks(db, id);
  return NextResponse.json({ tasks: listSwapTasks(db, id, auth.userId) });
}
