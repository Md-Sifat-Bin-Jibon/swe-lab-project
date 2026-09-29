import { randomBytes } from "node:crypto";
import type { DatabaseSync } from "node:sqlite";
import type { Activity } from "@/types";

/*
 * Activity log + escrow ledger.
 * Events are stored once (actor → target) and rendered per viewer, so the
 * same event reads "You accepted…" for one person and "Neha accepted…" for
 * the other.
 */

export type ActivityKind =
  | "proposal"
  | "counter"
  | "accepted"
  | "declined"
  | "withdrawn"
  | "completed"
  | "dispute_filed"
  | "dispute_resolved"
  | "review"
  | "topup"
  | "id_verified"
  | "meeting_invite"
  | "meeting_accepted"
  | "meeting_declined"
  | "meeting_cancelled";

export function logActivity(
  db: DatabaseSync,
  event: {
    actorId: string;
    targetId?: string | null;
    swapId?: string | null;
    kind: ActivityKind;
    data?: Record<string, unknown>;
  }
): void {
  try {
    db.prepare(
      "INSERT INTO activity_events (actor_id, target_id, swap_id, kind, data, created_at) VALUES (?, ?, ?, ?, ?, ?)"
    ).run(
      event.actorId,
      event.targetId ?? null,
      event.swapId ?? null,
      event.kind,
      event.data ? JSON.stringify(event.data) : null,
      new Date().toISOString()
    );
  } catch (error) {
    console.error("[activity] could not log event:", error); // never block the action itself
  }
}

/** Keep activity + ledger links pointing at the swap after its id changes (proposal → active → completed). */
export function moveSwapReferences(db: DatabaseSync, fromId: string, toId: string): void {
  db.prepare("UPDATE activity_events SET swap_id = ? WHERE swap_id = ?").run(toId, fromId);
  db.prepare("UPDATE wallet_transactions SET swap_id = ? WHERE swap_id = ?").run(toId, fromId);
}

export type LedgerType = "escrow_hold" | "escrow_release" | "escrow_refund";

/** Records an escrow movement that has ALREADY been applied to users.balance. */
export function recordLedger(
  db: DatabaseSync,
  userId: string,
  type: LedgerType,
  amount: number,
  swapId: string | null,
  note: string
): void {
  const value = Math.round(Math.abs(amount) * 100) / 100;
  if (!value) return;
  const balance = (db.prepare("SELECT balance FROM users WHERE id = ?").get(userId) as { balance: number } | undefined)
    ?.balance;
  db.prepare(
    `INSERT INTO wallet_transactions (id, user_id, type, swap_id, note, amount, status, balance_after, created_at)
     VALUES (?, ?, ?, ?, ?, ?, 'succeeded', ?, ?)`
  ).run(
    `txn_${randomBytes(9).toString("hex")}`,
    userId,
    type,
    swapId,
    note,
    value,
    balance === undefined ? null : Number(balance),
    new Date().toISOString()
  );
}

// ------------------------------------------------------------------ feed ---

type EventRow = {
  id: number;
  actor_id: string;
  target_id: string | null;
  swap_id: string | null;
  kind: ActivityKind;
  data: string | null;
  created_at: string;
  actor_name: string | null;
  target_name: string | null;
  swap_exists: number | null;
};

function toIso(value: string): string {
  return value.includes("T") ? value : `${value.replace(" ", "T")}Z`;
}

const money = (n: unknown) =>
  Number(n ?? 0).toLocaleString("en-US", { style: "currency", currency: "USD" });

function describe(row: EventRow, viewerId: string): { subject: string; text: string; icon: Activity["icon"] } {
  const data = (row.data ? JSON.parse(row.data) : {}) as Record<string, unknown>;
  const byMe = row.actor_id === viewerId;
  const actor = byMe ? "You" : row.actor_name?.trim() || "Someone";
  const other = byMe ? row.target_name?.trim() || "your partner" : "you";

  // Skills from the viewer's point of view, when available.
  let skills = "";
  if (data.ownerOffer || data.partnerOffer) {
    const viewerIsOwner = data.ownerId === viewerId;
    const give = viewerIsOwner ? data.ownerOffer : data.partnerOffer;
    const get = viewerIsOwner ? data.partnerOffer : data.ownerOffer;
    if (give && get) skills = ` · ${give} ⇄ ${get}`;
  }

  switch (row.kind) {
    case "proposal":
      return { subject: actor, text: `sent ${byMe ? `${other} ` : "you "}a swap proposal${skills}`, icon: "proposal" };
    case "counter":
      return {
        subject: actor,
        text: `sent ${byMe ? `${other} ` : "you "}a counter-offer${skills}${
          data.depositChanged ? ` · escrow ${money(data.depositFrom)} → ${money(data.depositTo)}` : ""
        }`,
        icon: "counter",
      };
    case "accepted":
      return { subject: actor, text: `accepted ${byMe ? `${other}'s` : "your"} swap — it's now active${skills}`, icon: "accepted" };
    case "declined":
      return { subject: actor, text: `declined ${byMe ? `${other}'s` : "your"} swap proposal`, icon: "declined" };
    case "withdrawn":
      return { subject: actor, text: `withdrew ${byMe ? "your" : "their"} swap proposal${byMe ? ` to ${other}` : ""}`, icon: "declined" };
    case "completed":
      return { subject: actor, text: `marked the swap with ${byMe ? other : "you"} as completed${skills}`, icon: "completed" };
    case "dispute_filed":
      return { subject: actor, text: `opened a dispute on ${byMe ? `the swap with ${other}` : "your swap"}`, icon: "dispute" };
    case "dispute_resolved":
      return { subject: actor, text: `responded to the dispute on ${byMe ? `the swap with ${other}` : "your swap"}`, icon: "dispute" };
    case "review":
      return {
        subject: actor,
        text: `rated ${byMe ? `the swap with ${other}` : "your swap"} ${Number(data.rating ?? 0)}★`,
        icon: "review",
      };
    case "topup":
      return { subject: actor, text: `added ${money(data.amount)} to your wallet${data.card ? ` (${data.card})` : ""}`, icon: "wallet" };
    case "id_verified":
      return { subject: actor, text: "verified your identity", icon: "verified" };
    case "meeting_invite":
      return { subject: actor, text: `invited ${byMe ? other : "you"} to a meeting — ${data.title}`, icon: "meeting" };
    case "meeting_accepted":
      return { subject: actor, text: `accepted ${byMe ? `${other}'s` : "your"} meeting invite — ${data.title}`, icon: "meeting" };
    case "meeting_declined":
      return { subject: actor, text: `declined ${byMe ? `${other}'s` : "your"} meeting invite — ${data.title}`, icon: "meeting" };
    case "meeting_cancelled":
      return { subject: actor, text: `cancelled the meeting — ${data.title}`, icon: "meeting" };
    default:
      return { subject: actor, text: "updated a swap", icon: "proposal" };
  }
}

export function buildActivityFeed(db: DatabaseSync, viewerId: string, limit = 8): Activity[] {
  const rows = db
    .prepare(
      `SELECT e.*, a.full_name AS actor_name, t.full_name AS target_name,
              (SELECT 1 FROM swaps s WHERE s.id = e.swap_id) AS swap_exists
       FROM activity_events e
       LEFT JOIN users a ON a.id = e.actor_id
       LEFT JOIN users t ON t.id = e.target_id
       WHERE e.actor_id = ? OR e.target_id = ?
       ORDER BY e.created_at DESC, e.id DESC
       LIMIT ?`
    )
    .all(viewerId, viewerId, limit) as EventRow[];

  return rows.map((row, index) => {
    const { subject, text, icon } = describe(row, viewerId);
    const href =
      row.kind === "topup"
        ? "/wallet"
        : row.kind === "id_verified"
          ? "/verify"
          : row.swap_id && row.swap_exists
            ? `/swaps/${encodeURIComponent(row.swap_id)}`
            : null;
    return {
      id: row.id,
      kind: row.kind,
      icon,
      subject,
      text: text.trim(),
      href,
      at: toIso(row.created_at),
      time: null,
      order: index,
    };
  });
}
