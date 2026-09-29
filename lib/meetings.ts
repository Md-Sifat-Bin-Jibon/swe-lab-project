import { randomBytes } from "node:crypto";
import type { DatabaseSync } from "node:sqlite";
import { logActivity } from "@/lib/activity";
import { getOrCreateConversation, sendMessage } from "@/lib/chat";
import { cancelGoogleEvent, createMeetingLink } from "@/lib/googleMeet";
import type { Meeting } from "@/types";

const MAX_TITLE = 100;
const MAX_AGENDA = 500;
const MAX_DURATION = 240;

type MeetingRow = {
  id: string;
  swap_id: string | null;
  conversation_id: string | null;
  organizer_id: string;
  invitee_id: string;
  title: string;
  agenda: string | null;
  starts_at: string;
  duration_minutes: number;
  status: Meeting["status"];
  join_url: string | null;
  provider: Meeting["provider"];
  google_event_id: string | null;
  link_error: string | null;
  created_at: string;
  responded_at: string | null;
};

function nameOf(db: DatabaseSync, userId: string): string {
  return (
    (db.prepare("SELECT full_name FROM users WHERE id = ?").get(userId) as { full_name: string | null } | undefined)
      ?.full_name || "Member"
  );
}

function emailOf(db: DatabaseSync, userId: string): string {
  return (
    (db.prepare("SELECT email FROM users WHERE id = ?").get(userId) as { email: string } | undefined)?.email || ""
  );
}

function toMeeting(db: DatabaseSync, row: MeetingRow, viewerId: string): Meeting {
  const iAmOrganizer = row.organizer_id === viewerId;
  const otherId = iAmOrganizer ? row.invitee_id : row.organizer_id;
  return {
    id: row.id,
    swapId: row.swap_id,
    title: row.title,
    agenda: row.agenda,
    startsAt: row.starts_at,
    durationMinutes: row.duration_minutes,
    status: row.status,
    joinUrl: row.join_url,
    provider: row.provider,
    linkError: row.link_error,
    organizer: { id: row.organizer_id, name: nameOf(db, row.organizer_id) },
    invitee: { id: row.invitee_id, name: nameOf(db, row.invitee_id) },
    partnerName: nameOf(db, otherId),
    viewerRole: iAmOrganizer ? "organizer" : "invitee",
    createdAt: row.created_at,
    respondedAt: row.responded_at,
  };
}

export function listMeetings(db: DatabaseSync, viewerId: string, swapId?: string): Meeting[] {
  const rows = (
    swapId
      ? db
          .prepare("SELECT * FROM meetings WHERE swap_id = ? AND (organizer_id = ? OR invitee_id = ?) ORDER BY starts_at DESC")
          .all(swapId, viewerId, viewerId)
      : db
          .prepare("SELECT * FROM meetings WHERE organizer_id = ? OR invitee_id = ? ORDER BY starts_at DESC LIMIT 50")
          .all(viewerId, viewerId)
  ) as MeetingRow[];
  return rows.map((r) => toMeeting(db, r, viewerId));
}

export function getMeeting(db: DatabaseSync, id: string, viewerId: string): Meeting | null {
  const row = db
    .prepare("SELECT * FROM meetings WHERE id = ? AND (organizer_id = ? OR invitee_id = ?)")
    .get(id, viewerId, viewerId) as MeetingRow | undefined;
  return row ? toMeeting(db, row, viewerId) : null;
}

export type ScheduleInput = {
  swapId?: string | null;
  inviteeId: string;
  title: string;
  agenda?: string | null;
  startsAt: string;
  durationMinutes: number;
};

export type ScheduleResult = { ok: true; meeting: Meeting } | { ok: false; status: number; error: string };

export async function scheduleMeeting(
  db: DatabaseSync,
  organizerId: string,
  input: ScheduleInput
): Promise<ScheduleResult> {
  const title = String(input.title || "").trim().replace(/\s+/g, " ").slice(0, MAX_TITLE);
  const agenda = String(input.agenda || "").trim().slice(0, MAX_AGENDA) || null;
  if (!title) return { ok: false, status: 400, error: "Give the meeting a title." };

  const invitee = db.prepare("SELECT id, status FROM users WHERE id = ?").get(input.inviteeId) as
    | { id: string; status: string }
    | undefined;
  if (!invitee || invitee.id === organizerId) return { ok: false, status: 404, error: "Member not found." };
  if (invitee.status === "suspended") return { ok: false, status: 400, error: "That member's account is suspended." };

  const start = new Date(input.startsAt);
  if (Number.isNaN(start.getTime())) return { ok: false, status: 400, error: "Pick a valid date and time." };
  if (start.getTime() < Date.now() - 60_000) return { ok: false, status: 400, error: "Pick a time in the future." };
  if (start.getTime() > Date.now() + 365 * 86_400_000) return { ok: false, status: 400, error: "Meetings can be at most a year ahead." };

  const duration = Math.round(Number(input.durationMinutes) || 30);
  if (duration < 10 || duration > MAX_DURATION) {
    return { ok: false, status: 400, error: `Length must be between 10 and ${MAX_DURATION} minutes.` };
  }

  // One pending invite at a time per pair, so nobody can spam invitations.
  const pending = db
    .prepare(
      `SELECT COUNT(*) AS c FROM meetings
       WHERE status = 'pending' AND ((organizer_id = ? AND invitee_id = ?) OR (organizer_id = ? AND invitee_id = ?))`
    )
    .get(organizerId, input.inviteeId, input.inviteeId, organizerId) as { c: number };
  if (pending.c >= 3) {
    return { ok: false, status: 429, error: "You already have 3 pending invitations with this member." };
  }

  const id = `mtg_${randomBytes(8).toString("hex")}`;
  const now = new Date().toISOString();
  const link = await createMeetingLink({
    meetingId: id,
    title,
    agenda,
    startsAt: start.toISOString(),
    durationMinutes: duration,
    attendees: [emailOf(db, organizerId), emailOf(db, input.inviteeId)],
  });

  const conversation = getOrCreateConversation(db, organizerId, input.inviteeId);

  db.prepare(
    `INSERT INTO meetings (id, swap_id, conversation_id, organizer_id, invitee_id, title, agenda, starts_at,
       duration_minutes, status, join_url, provider, google_event_id, link_error, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    input.swapId ?? null,
    conversation?.id ?? null,
    organizerId,
    input.inviteeId,
    title,
    agenda,
    start.toISOString(),
    duration,
    link.joinUrl,
    link.provider,
    link.googleEventId,
    link.error,
    now,
    now
  );

  // Tell the other person in chat, and log it on both timelines.
  try {
    if (conversation) {
      const when = start.toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });
      sendMessage(db, conversation.id, organizerId, {
        text: [
          `📅 Meeting invite: ${title}`,
          `• When: ${when} (${duration} min)`,
          agenda ? `• Agenda: ${agenda}` : null,
          `Open Swaps → Meetings to accept and join.`,
        ]
          .filter(Boolean)
          .join("\n"),
      });
    }
  } catch (error) {
    console.error("[meetings] could not post the chat notice:", error);
  }

  logActivity(db, {
    actorId: organizerId,
    targetId: input.inviteeId,
    swapId: input.swapId ?? null,
    kind: "meeting_invite",
    data: { title, startsAt: start.toISOString(), provider: link.provider },
  });

  return { ok: true, meeting: getMeeting(db, id, organizerId)! };
}

export async function respondToMeeting(
  db: DatabaseSync,
  userId: string,
  meetingId: string,
  action: "accept" | "decline" | "cancel"
): Promise<ScheduleResult> {
  const row = db.prepare("SELECT * FROM meetings WHERE id = ?").get(meetingId) as MeetingRow | undefined;
  if (!row || (row.organizer_id !== userId && row.invitee_id !== userId)) {
    return { ok: false, status: 404, error: "Meeting not found." };
  }
  if (row.status === "cancelled") return { ok: false, status: 409, error: "This meeting was already cancelled." };

  const now = new Date().toISOString();

  if (action === "cancel") {
    db.prepare("UPDATE meetings SET status = 'cancelled', updated_at = ?, responded_at = ? WHERE id = ?").run(now, now, meetingId);
    await cancelGoogleEvent(row.google_event_id);
  } else {
    if (row.invitee_id !== userId) {
      return { ok: false, status: 403, error: "Only the invited member can accept or decline." };
    }
    if (row.status !== "pending") return { ok: false, status: 409, error: "You've already responded to this invite." };
    db.prepare("UPDATE meetings SET status = ?, updated_at = ?, responded_at = ? WHERE id = ?").run(
      action === "accept" ? "accepted" : "declined",
      now,
      now,
      meetingId
    );
    if (action === "decline") await cancelGoogleEvent(row.google_event_id);
  }

  const otherId = row.organizer_id === userId ? row.invitee_id : row.organizer_id;
  logActivity(db, {
    actorId: userId,
    targetId: otherId,
    swapId: row.swap_id,
    kind: action === "accept" ? "meeting_accepted" : action === "decline" ? "meeting_declined" : "meeting_cancelled",
    data: { title: row.title, startsAt: row.starts_at },
  });

  try {
    if (row.conversation_id) {
      const verb = action === "accept" ? "accepted" : action === "decline" ? "declined" : "cancelled";
      sendMessage(db, row.conversation_id, userId, { text: `📅 ${nameOf(db, userId)} ${verb} the meeting "${row.title}".` });
    }
  } catch {
    /* chat notice is best effort */
  }

  return { ok: true, meeting: getMeeting(db, meetingId, userId)! };
}
