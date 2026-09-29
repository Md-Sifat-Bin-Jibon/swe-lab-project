import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { getMeeting, respondToMeeting } from "@/lib/meetings";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: RouteContext) {
  const auth = requireUserId(request);
  if ("response" in auth) return auth.response;
  const { id } = await context.params;
  const meeting = getMeeting(getDb(), id, auth.userId);
  if (!meeting) return NextResponse.json({ error: "Meeting not found." }, { status: 404 });
  return NextResponse.json({ meeting });
}

/** Body: { action: "accept" | "decline" | "cancel" } */
export async function PATCH(request: Request, context: RouteContext) {
  const auth = requireUserId(request);
  if ("response" in auth) return auth.response;

  const { id } = await context.params;
  const body = await request.json().catch(() => ({}));
  const action = body.action === "accept" || body.action === "decline" || body.action === "cancel" ? body.action : null;
  if (!action) return NextResponse.json({ error: "Unknown action." }, { status: 400 });

  const result = await respondToMeeting(getDb(), auth.userId, id, action);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
  return NextResponse.json({ meeting: result.meeting });
}
