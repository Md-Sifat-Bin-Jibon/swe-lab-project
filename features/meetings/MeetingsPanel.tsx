"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useToast } from "@/hooks/useToast";
import { fetchMeetings, respondToMeeting, scheduleMeeting } from "@/services/api";
import type { Meeting } from "@/types";

const DURATIONS = [15, 30, 45, 60, 90];

function localInputValue(date: Date): string {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

function formatWhen(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleString("en-US", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

function statusChip(m: Meeting) {
  const map = {
    pending: { label: m.viewerRole === "invitee" ? "Waiting for you" : "Invite sent", className: "bg-amber-50 text-amber-700" },
    accepted: { label: "Accepted", className: "bg-emerald-50 text-emerald-700" },
    declined: { label: "Declined", className: "bg-slate-100 text-slate-500" },
    cancelled: { label: "Cancelled", className: "bg-slate-100 text-slate-500" },
  } as const;
  const s = map[m.status];
  return <span className={`rounded-md px-2 py-0.5 text-xs font-semibold ${s.className}`}>{s.label}</span>;
}

/** Meeting invitations between the two members of a swap. */
export function MeetingsPanel({
  swapId,
  partnerId,
  partnerName,
}: {
  swapId: string;
  partnerId: string | null;
  partnerName: string;
}) {
  const { showToast } = useToast();
  const [meetings, setMeetings] = useState<Meeting[] | null>(null);
  const [googleConnected, setGoogleConnected] = useState(true);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState(`Swap session with ${partnerName}`);
  const [startsAt, setStartsAt] = useState(() => localInputValue(new Date(Date.now() + 86_400_000)));
  const [duration, setDuration] = useState(30);
  const [agenda, setAgenda] = useState("");

  const load = useCallback(() => {
    fetchMeetings(swapId)
      .then((r) => {
        setMeetings(r.meetings);
        setGoogleConnected(r.googleMeetConnected);
      })
      .catch(() => setMeetings([]));
  }, [swapId]);

  useEffect(load, [load]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!partnerId) return;
    setBusy(true);
    setError(null);
    try {
      const { meeting } = await scheduleMeeting({
        inviteeId: partnerId,
        title,
        agenda: agenda || null,
        startsAt: new Date(startsAt).toISOString(),
        durationMinutes: duration,
        swapId,
      });
      setMeetings((list) => [meeting, ...(list ?? [])]);
      setOpen(false);
      setAgenda("");
      showToast(
        meeting.provider === "google_meet"
          ? `Google Meet invite sent to ${partnerName}.`
          : `Meeting invite sent to ${partnerName}.`
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create the meeting.");
    } finally {
      setBusy(false);
    }
  }

  async function respond(meeting: Meeting, action: "accept" | "decline" | "cancel") {
    if (action === "cancel" && !window.confirm("Cancel this meeting for both of you?")) return;
    setBusy(true);
    try {
      const { meeting: updated } = await respondToMeeting(meeting.id, action);
      setMeetings((list) => (list ?? []).map((m) => (m.id === updated.id ? updated : m)));
      showToast(action === "accept" ? "Meeting accepted." : action === "decline" ? "Invite declined." : "Meeting cancelled.");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not update the meeting.");
    } finally {
      setBusy(false);
    }
  }

  const upcoming = (meetings ?? []).filter((m) => m.status !== "cancelled" && m.status !== "declined");
  const past = (meetings ?? []).filter((m) => m.status === "cancelled" || m.status === "declined");

  return (
    <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Meetings</h2>
          <p className="mt-0.5 text-sm text-slate-500">
            Invite {partnerName} to a video call. The link is created by SwapSpot and works for both of you.
          </p>
        </div>
        {partnerId ? (
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="rounded-lg bg-swapspot-blue px-4 py-2 text-sm font-semibold text-white hover:bg-[#3f52c4]"
          >
            {open ? "Close" : "Schedule a meeting"}
          </button>
        ) : null}
      </div>

      {open ? (
        <form onSubmit={submit} className="mt-5 space-y-4 rounded-xl border border-slate-100 bg-slate-50 p-4">
          <div>
            <label htmlFor="meeting-title" className="mb-1.5 block text-sm font-medium text-slate-600">
              Title
            </label>
            <input
              id="meeting-title"
              value={title}
              maxLength={100}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3.5 py-2 text-sm focus:border-swapspot-blue focus:outline-none focus:ring-2 focus:ring-swapspot-blue/20"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="meeting-start" className="mb-1.5 block text-sm font-medium text-slate-600">
                Date &amp; time
              </label>
              <input
                id="meeting-start"
                type="datetime-local"
                value={startsAt}
                min={localInputValue(new Date())}
                onChange={(e) => setStartsAt(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3.5 py-2 text-sm focus:border-swapspot-blue focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="meeting-duration" className="mb-1.5 block text-sm font-medium text-slate-600">
                Length
              </label>
              <select
                id="meeting-duration"
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-200 px-3.5 py-2 text-sm focus:border-swapspot-blue focus:outline-none"
              >
                {DURATIONS.map((d) => (
                  <option key={d} value={d}>
                    {d} minutes
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label htmlFor="meeting-agenda" className="mb-1.5 block text-sm font-medium text-slate-600">
              Agenda <span className="font-normal text-slate-400">(optional)</span>
            </label>
            <textarea
              id="meeting-agenda"
              rows={2}
              maxLength={500}
              value={agenda}
              onChange={(e) => setAgenda(e.target.value)}
              placeholder="What will you cover?"
              className="w-full resize-none rounded-lg border border-slate-200 px-3.5 py-2 text-sm focus:border-swapspot-blue focus:outline-none"
            />
          </div>

          {!googleConnected ? (
            <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
              Google Meet isn&apos;t connected, so SwapSpot will create its own meeting room link instead.
            </p>
          ) : null}
          {error ? <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}

          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setOpen(false)} className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100">
              Cancel
            </button>
            <button type="submit" disabled={busy} className="rounded-lg bg-swapspot-blue px-5 py-2 text-sm font-semibold text-white hover:bg-[#3f52c4] disabled:opacity-70">
              {busy ? "Creating…" : "Send invite"}
            </button>
          </div>
        </form>
      ) : null}

      <div className="mt-5 space-y-3">
        {meetings === null ? (
          <div className="h-20 animate-pulse rounded-xl bg-slate-100" />
        ) : upcoming.length === 0 && past.length === 0 ? (
          <p className="rounded-xl bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
            No meetings yet. Schedule one to plan your sessions together.
          </p>
        ) : (
          [...upcoming, ...past].map((m) => {
            const over = new Date(m.startsAt).getTime() + m.durationMinutes * 60_000 < Date.now();
            const canJoin = m.status === "accepted" && !over && m.joinUrl;
            return (
              <div key={m.id} className={`rounded-xl border p-4 ${m.status === "cancelled" || m.status === "declined" ? "border-slate-100 bg-slate-50/60 opacity-70" : "border-slate-200"}`}>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-slate-900">{m.title}</h3>
                      {statusChip(m)}
                      {m.provider === "google_meet" ? (
                        <span className="rounded-md bg-swapspot-blue/10 px-2 py-0.5 text-xs font-semibold text-swapspot-blue">Google Meet</span>
                      ) : (
                        <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-500">SwapSpot room</span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-slate-600">
                      {formatWhen(m.startsAt)} · {m.durationMinutes} min · with {m.partnerName}
                    </p>
                    {m.agenda ? <p className="mt-1 text-sm text-slate-500">{m.agenda}</p> : null}
                    {over && m.status === "accepted" ? <p className="mt-1 text-xs text-slate-400">This meeting has finished.</p> : null}
                  </div>

                  <div className="flex shrink-0 flex-wrap gap-2">
                    {canJoin ? (
                      <a
                        href={m.joinUrl!}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                      >
                        Join meeting ↗
                      </a>
                    ) : null}
                    {m.status === "pending" && m.viewerRole === "invitee" ? (
                      <>
                        <button type="button" disabled={busy} onClick={() => respond(m, "accept")} className="rounded-lg bg-swapspot-blue px-4 py-2 text-sm font-semibold text-white hover:bg-[#3f52c4] disabled:opacity-60">
                          Accept
                        </button>
                        <button type="button" disabled={busy} onClick={() => respond(m, "decline")} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-60">
                          Decline
                        </button>
                      </>
                    ) : null}
                    {(m.status === "accepted" || (m.status === "pending" && m.viewerRole === "organizer")) && !over ? (
                      <button type="button" disabled={busy} onClick={() => respond(m, "cancel")} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-50 disabled:opacity-60">
                        Cancel
                      </button>
                    ) : null}
                  </div>
                </div>

                {m.linkError && m.viewerRole === "organizer" ? (
                  <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">{m.linkError}</p>
                ) : null}
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
