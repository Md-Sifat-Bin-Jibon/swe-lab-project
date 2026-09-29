import { randomBytes } from "node:crypto";

/*
 * Google Meet links via the Google Calendar API.
 *
 * Calendar's events.insert creates a real Meet conference when you pass
 * conferenceData + conferenceDataVersion=1, and emails both attendees a
 * calendar invite. It needs a Google account's OAuth refresh token:
 *
 *   GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN
 *   GOOGLE_CALENDAR_ID (optional, defaults to "primary")
 *
 * Without those the platform falls back to its own room link so the feature
 * still works; the meeting records which provider was used.
 */

export type MeetingLink = {
  joinUrl: string;
  provider: "google_meet" | "fallback";
  googleEventId: string | null;
  error: string | null;
};

/** Endpoints are overridable so the integration can be pointed at a test double. */
const TOKEN_URL = () => process.env.GOOGLE_TOKEN_URL?.trim() || "https://oauth2.googleapis.com/token";
const CALENDAR_BASE = () =>
  (process.env.GOOGLE_CALENDAR_API_BASE?.trim() || "https://www.googleapis.com/calendar/v3").replace(/\/+$/, "");

export function isGoogleMeetConfigured(): boolean {
  return Boolean(
    process.env.GOOGLE_CLIENT_ID?.trim() &&
      process.env.GOOGLE_CLIENT_SECRET?.trim() &&
      process.env.GOOGLE_REFRESH_TOKEN?.trim()
  );
}

async function accessToken(): Promise<string> {
  const response = await fetch(TOKEN_URL(), {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!.trim(),
      client_secret: process.env.GOOGLE_CLIENT_SECRET!.trim(),
      refresh_token: process.env.GOOGLE_REFRESH_TOKEN!.trim(),
      grant_type: "refresh_token",
    }),
  });
  const payload = (await response.json().catch(() => null)) as { access_token?: string; error_description?: string; error?: string } | null;
  if (!response.ok || !payload?.access_token) {
    throw new Error(payload?.error_description || payload?.error || `Google token request failed (${response.status}).`);
  }
  return payload.access_token;
}

/** Local fallback room — a real, working link that needs no Google account. */
function fallbackLink(meetingId: string): string {
  return `https://meet.jit.si/swapspot-${meetingId.replace(/[^a-z0-9]/gi, "")}-${randomBytes(3).toString("hex")}`;
}

export async function createMeetingLink(input: {
  meetingId: string;
  title: string;
  agenda?: string | null;
  startsAt: string;
  durationMinutes: number;
  attendees: string[];
}): Promise<MeetingLink> {
  if (!isGoogleMeetConfigured()) {
    return {
      joinUrl: fallbackLink(input.meetingId),
      provider: "fallback",
      googleEventId: null,
      error: "Google Meet is not connected, so a SwapSpot meeting room was created instead.",
    };
  }

  try {
    const token = await accessToken();
    const start = new Date(input.startsAt);
    const end = new Date(start.getTime() + input.durationMinutes * 60_000);
    const calendarId = encodeURIComponent(process.env.GOOGLE_CALENDAR_ID?.trim() || "primary");

    const response = await fetch(
      `${CALENDAR_BASE()}/calendars/${calendarId}/events?conferenceDataVersion=1&sendUpdates=all`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          summary: input.title,
          description: input.agenda || "SwapSpot skill-swap meeting",
          start: { dateTime: start.toISOString() },
          end: { dateTime: end.toISOString() },
          attendees: input.attendees.filter(Boolean).map((email) => ({ email })),
          conferenceData: {
            createRequest: {
              requestId: `swapspot-${input.meetingId}`,
              conferenceSolutionKey: { type: "hangoutsMeet" },
            },
          },
        }),
      }
    );

    const event = (await response.json().catch(() => null)) as
      | { id?: string; hangoutLink?: string; conferenceData?: { entryPoints?: { uri?: string; entryPointType?: string }[] }; error?: { message?: string } }
      | null;

    if (!response.ok) throw new Error(event?.error?.message || `Calendar API error (${response.status}).`);

    const link =
      event?.hangoutLink ||
      event?.conferenceData?.entryPoints?.find((e) => e.entryPointType === "video")?.uri ||
      null;
    if (!link) throw new Error("Google did not return a Meet link for this event.");

    return { joinUrl: link, provider: "google_meet", googleEventId: event?.id ?? null, error: null };
  } catch (error) {
    console.error("[googleMeet] could not create a Meet link:", error);
    return {
      joinUrl: fallbackLink(input.meetingId),
      provider: "fallback",
      googleEventId: null,
      error: `Google Meet link failed (${(error as Error).message}). A SwapSpot room was used instead.`,
    };
  }
}

/** Best-effort cleanup when a meeting is cancelled. */
export async function cancelGoogleEvent(eventId: string | null): Promise<void> {
  if (!eventId || !isGoogleMeetConfigured()) return;
  try {
    const token = await accessToken();
    const calendarId = encodeURIComponent(process.env.GOOGLE_CALENDAR_ID?.trim() || "primary");
    await fetch(`${CALENDAR_BASE()}/calendars/${calendarId}/events/${encodeURIComponent(eventId)}?sendUpdates=all`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch (error) {
    console.error("[googleMeet] could not cancel the calendar event:", error);
  }
}
