import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { isGoogleMeetConfigured } from "@/lib/googleMeet";
import { listMeetings, scheduleMeeting } from "@/lib/meetings";

export const runtime = "nodejs";

/** GET /api/meetings?swapId=… — meetings the signed-in member is part of. */
export async function GET(request: Request) {
  const auth = requireUserId(request);
  if ("response" in auth) return auth.response;

  const swapId = new URL(request.url).searchParams.get("swapId") ?? undefined;
  return NextResponse.json({
    meetings: listMeetings(getDb(), auth.userId, swapId || undefined),
    googleMeetConnected: isGoogleMeetConfigured(),
  });
}

/** Create an invite. Body: { inviteeId, title, agenda?, startsAt, durationMinutes, swapId? } */
export async function POST(request: Request) {
  const auth = requireUserId(request);
  if ("response" in auth) return auth.response;

  const body = await request.json().catch(() => ({}));
  const result = await scheduleMeeting(getDb(), auth.userId, {
    swapId: body.swapId ? String(body.swapId) : null,
    inviteeId: String(body.inviteeId || ""),
    title: String(body.title || ""),
    agenda: body.agenda ? String(body.agenda) : null,
    startsAt: String(body.startsAt || ""),
    durationMinutes: Number(body.durationMinutes ?? 30),
  });

  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
  return NextResponse.json({ meeting: result.meeting }, { status: 201 });
}
