import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { deleteManualTask, listSwapTasks, setTaskDone } from "@/lib/swapTasks";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string; taskId: string }> };

/** Tick / untick one of your own tasks. Body: { done: boolean } */
export async function PATCH(request: Request, context: RouteContext) {
  const auth = requireUserId(request);
  if ("response" in auth) return auth.response;

  const { id, taskId } = await context.params;
  const body = await request.json().catch(() => ({}));
  const db = getDb();
  const ok = setTaskDone(db, id, Number(taskId), auth.userId, Boolean(body.done));
  if (!ok) {
    return NextResponse.json({ error: "You can only update your own tasks." }, { status: 404 });
  }
  return NextResponse.json({ tasks: listSwapTasks(db, id, auth.userId) });
}

/** Delete one of your personal (manually added) tasks. */
export async function DELETE(request: Request, context: RouteContext) {
  const auth = requireUserId(request);
  if ("response" in auth) return auth.response;

  const { id, taskId } = await context.params;
  const db = getDb();
  if (!deleteManualTask(db, id, Number(taskId), auth.userId)) {
    return NextResponse.json({ error: "Only your own added tasks can be deleted." }, { status: 404 });
  }
  return NextResponse.json({ tasks: listSwapTasks(db, id, auth.userId) });
}
