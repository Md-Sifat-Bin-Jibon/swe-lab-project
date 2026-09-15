import type { DatabaseSync } from "node:sqlite";
import { getOrCreateConversation } from "@/lib/chat";
import {
  formatDisplayDate,
  formatMatchProfile,
  formatSwapRow,
  getUserSkills,
  timerUntilDeadline,
  type SwapRow,
  type UserRow,
} from "@/lib/format";
import type { Swap, SwapsPayload } from "@/types";

function getOtherUserId(row: SwapRow, viewerId: string): string | null {
  if (row.owner_id === viewerId) return row.partner_id;
  if (row.partner_id === viewerId) return row.owner_id;
  return null;
}

function loadUser(db: DatabaseSync, userId: string): UserRow | undefined {
  return db.prepare("SELECT * FROM users WHERE id = ?").get(userId) as
    | UserRow
    | undefined;
}

/** Swap visible to either the proposer (owner) or the recipient (partner). */
export function getParticipantSwap(
  db: DatabaseSync,
  swapId: string,
  userId: string
): SwapRow | null {
  const row = db
    .prepare(
      `SELECT * FROM swaps
       WHERE id = ? AND (owner_id = ? OR partner_id = ?)`
    )
    .get(swapId, userId, userId) as SwapRow | undefined;
  return row ?? null;
}

/** @deprecated Prefer getParticipantSwap — kept as alias. */
export function getOwnedSwap(
  db: DatabaseSync,
  swapId: string,
  ownerId: string
): SwapRow | null {
  return getParticipantSwap(db, swapId, ownerId);
}

export function formatSwapWithProfile(
  db: DatabaseSync,
  row: SwapRow,
  viewerId: string
): Swap & { profile: ReturnType<typeof formatMatchProfile> | null } {
  const swap = formatSwapRow(row, viewerId);
  const otherId = getOtherUserId(row, viewerId);
  let profile = null;

  if (otherId) {
    const other = loadUser(db, otherId);
    if (other) {
      profile = formatMatchProfile(other, getUserSkills(db, other.id));
      const name = other.full_name || swap.partnerName;
      swap.partnerName = name;
      if (swap.type === "proposal") {
        swap.name = name;
      } else if (swap.type === "ongoing" || swap.type === "completed") {
        swap.partner = name;
      }
    }
  }

  return { ...swap, profile };
}

export function getSwapsPayload(
  db: DatabaseSync,
  userId: string
): SwapsPayload {
  const rows = db
    .prepare(
      `SELECT * FROM swaps
       WHERE owner_id = ? OR partner_id = ?
       ORDER BY rowid DESC`
    )
    .all(userId, userId) as SwapRow[];

  const ongoingSwaps: SwapsPayload["ongoingSwaps"] = [];
  const pendingProposals: SwapsPayload["pendingProposals"] = [];
  const completedSwaps: SwapsPayload["completedSwaps"] = [];

  for (const row of rows) {
    const swap = formatSwapWithProfile(db, row, userId);
    if (swap.type === "ongoing") ongoingSwaps.push(swap);
    else if (swap.type === "proposal") pendingProposals.push(swap);
    else completedSwaps.push(swap);
  }

  return { ongoingSwaps, pendingProposals, completedSwaps };
}

export function countIncomingProposals(
  db: DatabaseSync,
  userId: string
): number {
  return (
    db
      .prepare(
        `SELECT COUNT(*) AS count FROM swaps
         WHERE partner_id = ? AND type = 'proposal'`
      )
      .get(userId) as { count: number }
  ).count;
}

export function countParticipantSwaps(
  db: DatabaseSync,
  userId: string,
  type: "ongoing" | "proposal" | "completed"
): number {
  return (
    db
      .prepare(
        `SELECT COUNT(*) AS count FROM swaps
         WHERE type = ? AND (owner_id = ? OR partner_id = ?)`
      )
      .get(type, userId, userId) as { count: number }
  ).count;
}

/** File a new dispute on an active ongoing swap (either party). */
export function fileDispute(
  db: DatabaseSync,
  userId: string,
  swapId: string,
  reason: string
): (Swap & { profile: ReturnType<typeof formatMatchProfile> | null }) | null {
  const row = getParticipantSwap(db, swapId, userId);
  if (!row || row.type !== "ongoing" || row.status === "dispute") return null;

  const description =
    reason.trim().length > 0
      ? `${row.description ? `${row.description}\n\n` : ""}Dispute filed: ${reason.trim()}`
      : row.description;

  db.prepare(
    `UPDATE swaps SET status = ?, action = ?, status_label = ?, description = ?
     WHERE id = ?`
  ).run("dispute", "dispute", "Dispute open", description, swapId);

  const updated = getParticipantSwap(db, swapId, userId);
  return updated ? formatSwapWithProfile(db, updated, userId) : null;
}

export function respondToDispute(
  db: DatabaseSync,
  userId: string,
  swapId: string,
  responseText: string
): (Swap & { profile: ReturnType<typeof formatMatchProfile> | null }) | null {
  const row = getParticipantSwap(db, swapId, userId);
  if (!row || row.type !== "ongoing" || row.status !== "dispute") return null;

  const description =
    responseText.trim().length > 0
      ? `${row.description ? `${row.description}\n\n` : ""}Dispute response: ${responseText.trim()}`
      : row.description;

  db.prepare(
    `UPDATE swaps SET status = ?, action = ?, status_label = ?, description = ? WHERE id = ?`
  ).run("active", "complete", "In progress", description, swapId);

  const updated = getParticipantSwap(db, swapId, userId);
  return updated ? formatSwapWithProfile(db, updated, userId) : null;
}

export function markSwapCompleted(
  db: DatabaseSync,
  userId: string,
  swapId: string
): SwapsPayload | null {
  const row = getParticipantSwap(db, swapId, userId);
  if (!row || row.type !== "ongoing") return null;

  const completedId = row.id.startsWith("ongoing-")
    ? row.id.replace("ongoing-", "completed-")
    : `completed-${Date.now()}`;
  const deposit = Number(row.deposit ?? 0);
  const refund = deposit > 0 ? Math.round(deposit * 0.95 * 100) / 100 : 0;

  db.prepare("DELETE FROM swaps WHERE id = ?").run(swapId);

  db.prepare(
    `INSERT INTO swaps (
      id, owner_id, partner_id, type, swapping, exchange, offering, swapped,
      partner_name, timer, action, status, status_label, started_at, deadline,
      received_at, completed_at, rating, description, deposit
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    completedId,
    row.owner_id,
    row.partner_id,
    "completed",
    null,
    row.exchange,
    null,
    row.swapping,
    row.partner_name,
    null,
    null,
    null,
    "Completed",
    null,
    null,
    null,
    "Just now",
    "5.0",
    row.description,
    deposit
  );

  // Refund escrow to the original proposer; bump completed count for both.
  if (refund > 0) {
    db.prepare("UPDATE users SET balance = balance + ? WHERE id = ?").run(
      refund,
      row.owner_id
    );
  }
  db.prepare(
    "UPDATE users SET completed_swaps = completed_swaps + 1 WHERE id IN (?, ?)"
  ).run(row.owner_id, row.partner_id);

  return getSwapsPayload(db, userId);
}

/** Only the recipient (partner) can accept. */
export function acceptProposal(
  db: DatabaseSync,
  userId: string,
  swapId: string
): (Swap & { profile: ReturnType<typeof formatMatchProfile> | null }) | null {
  const row = getParticipantSwap(db, swapId, userId);
  if (!row || row.type !== "proposal") return null;
  if (row.partner_id !== userId) return null;

  const ongoingId = `ongoing-${row.owner_id}-${Date.now()}`;
  const started = new Date();
  let deadlineDate: Date;
  if (row.deadline) {
    const parsed = new Date(row.deadline);
    deadlineDate = Number.isNaN(parsed.getTime())
      ? new Date(started.getTime() + 14 * 24 * 60 * 60 * 1000)
      : parsed;
  } else {
    deadlineDate = new Date(started.getTime() + 14 * 24 * 60 * 60 * 1000);
  }

  const proposer = loadUser(db, row.owner_id);
  const recipient = loadUser(db, row.partner_id!);
  // Keep partner_name as the "other party" is viewer-dependent; store recipient name
  // for proposer-centric seed compatibility, but formatSwapWithProfile remaps.
  const storedPartnerName =
    recipient?.full_name || row.partner_name || "Partner";

  db.prepare("DELETE FROM swaps WHERE id = ?").run(swapId);

  db.prepare(
    `INSERT INTO swaps (
      id, owner_id, partner_id, type, swapping, exchange, offering, swapped,
      partner_name, timer, action, status, status_label, started_at, deadline,
      received_at, completed_at, rating, description, deposit
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    ongoingId,
    row.owner_id,
    row.partner_id,
    "ongoing",
    // swapping = proposer's offer, exchange = recipient's offer
    row.exchange,
    row.offering,
    null,
    null,
    storedPartnerName,
    timerUntilDeadline(deadlineDate.toISOString()),
    "complete",
    "active",
    "Active",
    formatDisplayDate(started),
    formatDisplayDate(deadlineDate),
    null,
    null,
    null,
    row.description,
    row.deposit ?? 0
  );

  void proposer;
  getOrCreateConversation(db, row.owner_id, row.partner_id!);
  const created = getParticipantSwap(db, ongoingId, userId);
  return created ? formatSwapWithProfile(db, created, userId) : null;
}

/** Recipient declines or proposer cancels — always refunds proposer's deposit. */
export function declineProposal(
  db: DatabaseSync,
  userId: string,
  swapId: string
): boolean {
  const row = getParticipantSwap(db, swapId, userId);
  if (!row || row.type !== "proposal") return false;

  const deposit = Number(row.deposit ?? 0);
  db.prepare("DELETE FROM swaps WHERE id = ?").run(swapId);

  if (deposit > 0) {
    db.prepare("UPDATE users SET balance = balance + ? WHERE id = ?").run(
      deposit,
      row.owner_id
    );
  }

  return true;
}

export function proposeSwap(
  db: DatabaseSync,
  ownerId: string,
  input: {
    partnerId: string;
    partnerName: string;
    offering: string;
    exchange: string;
    description?: string;
    deadline?: string;
    deposit?: number;
  }
):
  | { ok: true; proposal: Swap }
  | {
      ok: false;
      reason: "duplicate" | "partner_not_found" | "insufficient_balance";
      balance?: number;
      deposit?: number;
    } {
  const owner = loadUser(db, ownerId);
  if (!owner) {
    return { ok: false, reason: "partner_not_found" };
  }

  const partner = db
    .prepare("SELECT * FROM users WHERE id = ? AND is_browseable = 1")
    .get(input.partnerId) as UserRow | undefined;

  if (!partner || partner.id === ownerId) {
    return { ok: false, reason: "partner_not_found" };
  }

  const duplicate = db
    .prepare(
      `SELECT id FROM swaps
       WHERE type = 'proposal'
         AND (
           (owner_id = ? AND partner_id = ?)
           OR (owner_id = ? AND partner_id = ?)
         )`
    )
    .get(ownerId, input.partnerId, input.partnerId, ownerId) as
    | { id: string }
    | undefined;

  if (duplicate) {
    return { ok: false, reason: "duplicate" };
  }

  const deposit =
    typeof input.deposit === "number" && Number.isFinite(input.deposit)
      ? Math.max(0, input.deposit)
      : 0;
  const balance = Number(owner.balance ?? 0);

  if (deposit > balance) {
    return {
      ok: false,
      reason: "insufficient_balance",
      balance,
      deposit,
    };
  }

  const id = `proposal-${input.partnerId}-${Date.now()}`;
  const description =
    input.description ||
    `${owner.full_name || "A member"} proposed swapping ${input.exchange} for ${input.offering}.`;
  const deadline = input.deadline?.trim() || null;

  db.prepare(
    `INSERT INTO swaps (
      id, owner_id, partner_id, type, swapping, exchange, offering, swapped,
      partner_name, timer, action, status, status_label, started_at, deadline,
      received_at, completed_at, rating, description, deposit
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    ownerId,
    input.partnerId,
    "proposal",
    null,
    input.exchange,
    input.offering,
    null,
    input.partnerName || partner.full_name,
    null,
    null,
    "pending",
    "Pending",
    null,
    deadline,
    "Just now",
    null,
    null,
    description,
    deposit
  );

  if (deposit > 0) {
    db.prepare("UPDATE users SET balance = balance - ? WHERE id = ?").run(
      deposit,
      ownerId
    );
  }

  getOrCreateConversation(db, ownerId, input.partnerId);

  const created = getParticipantSwap(db, id, ownerId);
  if (!created) {
    return { ok: false, reason: "partner_not_found" };
  }

  return { ok: true, proposal: formatSwapWithProfile(db, created, ownerId) };
}

export function submitReview(
  db: DatabaseSync,
  userId: string,
  swapId: string,
  rating: string | number
): (Swap & { profile: ReturnType<typeof formatMatchProfile> | null }) | null {
  const row = getParticipantSwap(db, swapId, userId);
  if (!row || row.type !== "completed") return null;

  db.prepare("UPDATE swaps SET rating = ? WHERE id = ?").run(
    String(rating),
    swapId
  );

  const updated = getParticipantSwap(db, swapId, userId);
  return updated ? formatSwapWithProfile(db, updated, userId) : null;
}
