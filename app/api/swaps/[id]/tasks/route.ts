import { after, NextResponse } from "next/server";
import { requireUserId } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { getParticipantSwap } from "@/lib/swaps";
import {
  addManualTask,
  generateSwapTasks,
  listSwapTasks,
  markTasksPending,
  needsInitialPlan,
} from "@/lib/swapTasks";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: RouteContext) {
  const auth = requireUserId(request);
  if ("response" in auth) return auth.response;

  const { id } = await context.params;
  const db = getDb();
  if (!getParticipantSwap(db, id, auth.userId)) {
    return NextResponse.json({ error: "Swap not found." }, { status: 404 });
  }

  // Swaps accepted before this feature (or interrupted by a restart) get a plan on first view.
  if (needsInitialPlan(db, id)) {
    markTasksPending(db, id);
    after(() => generateSwapTasks(db, id));
  }

  return NextResponse.json({ tasks: listSwapTasks(db, id, auth.userId) });
}

/** Add a personal to-do. Body: { title, dueDate? } */
export async function POST(request: Request, context: RouteContext) {
  const auth = requireUserId(request);
  if ("response" in auth) return auth.response;

  const { id } = await context.params;
  const body = await request.json().catch(() => ({}));
  const db = getDb();
  const error = addManualTask(
    db,
    id,
    auth.userId,
    String(body.title ?? ""),
    body.dueDate ? String(body.dueDate) : null
  );
  if (error) return NextResponse.json({ error }, { status: 400 });

  return NextResponse.json({ tasks: listSwapTasks(db, id, auth.userId) }, { status: 201 });
}
