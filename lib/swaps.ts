import type { DatabaseSync } from "node:sqlite";
import { getOrCreateConversation, sendMessage } from "@/lib/chat";
import {
  formatDisplayDate,
  formatMatchProfile,
  formatSwapRow,
  getUserSkills,
  timerUntilDeadline,
  type SwapRow,
  type UserRow,
} from "@/lib/format";
import { logActivity, moveSwapReferences, recordLedger } from "@/lib/activity";
import { taskProgress } from "@/lib/swapTasks";
import type { Swap, SwapOfferEntry, SwapsPayload } from "@/types";

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
  if (swap.type === "ongoing") swap.tasks = taskProgress(db, row.id, viewerId);
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
         WHERE type = 'proposal' AND COALESCE(awaiting_user_id, partner_id) = ?`
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
  logActivity(db, {
    actorId: userId,
    targetId: row.owner_id === userId ? row.partner_id : row.owner_id,
    swapId,
    kind: "dispute_filed",
  });

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
  logActivity(db, {
    actorId: userId,
    targetId: row.owner_id === userId ? row.partner_id : row.owner_id,
    swapId,
    kind: "dispute_resolved",
  });

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
  // Keep the plan + negotiation history with the completed swap.
  db.prepare("UPDATE swap_tasks SET swap_id = ? WHERE swap_id = ?").run(completedId, swapId);
  db.prepare("UPDATE swap_offers SET swap_id = ? WHERE swap_id = ?").run(completedId, swapId);
  moveSwapReferences(db, swapId, completedId);

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
    db.prepare("UPDATE users SET balance = ROUND(balance + ?, 2) WHERE id = ?").run(
      refund,
      row.owner_id
    );
    recordLedger(
      db,
      row.owner_id,
      "escrow_refund",
      refund,
      completedId,
      `Escrow returned after completing the swap (5% fee on $${deposit.toFixed(2)})`
    );
  }
  db.prepare(
    "UPDATE users SET completed_swaps = completed_swaps + 1 WHERE id IN (?, ?)"
  ).run(row.owner_id, row.partner_id);
  logActivity(db, {
    actorId: userId,
    targetId: row.owner_id === userId ? row.partner_id : row.owner_id,
    swapId: completedId,
    kind: "completed",
    data: { ownerOffer: row.swapping, partnerOffer: row.exchange, ownerId: row.owner_id },
  });

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
  // Only the person whose turn it is can accept the current terms.
  if ((row.awaiting_user_id ?? row.partner_id) !== userId) return null;

  // Settle escrow: the proposer's held deposit must match the agreed amount.
  // (It only differs when the recipient countered with a new amount.)
  const agreedDeposit = Number(row.deposit ?? 0);
  const held = Number(row.deposit_held ?? row.deposit ?? 0);
  const escrowDelta = Math.round((agreedDeposit - held) * 100) / 100;
  if (escrowDelta > 0) {
    const owner = loadUser(db, row.owner_id);
    const balance = Number(owner?.balance ?? 0);
    if (balance < escrowDelta) {
      throw new SwapActionError(
        `Accepting raises your escrow deposit by $${escrowDelta.toFixed(2)}, but your balance is $${balance.toFixed(2)}. Add funds or send a counter-offer with a lower deposit.`,
        402
      );
    }
  }
  if (escrowDelta !== 0) {
    db.prepare("UPDATE users SET balance = ROUND(balance - ?, 2) WHERE id = ?").run(escrowDelta, row.owner_id);
    recordLedger(
      db,
      row.owner_id,
      escrowDelta > 0 ? "escrow_hold" : "escrow_release",
      escrowDelta,
      swapId,
      `Escrow adjusted to $${agreedDeposit.toFixed(2)} when accepting the counter-offer`
    );
  }

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
  // Keep the negotiation history attached to the now-active swap.
  db.prepare("UPDATE swap_offers SET swap_id = ? WHERE swap_id = ?").run(ongoingId, swapId);
  moveSwapReferences(db, swapId, ongoingId);
  logActivity(db, {
    actorId: userId,
    targetId: row.owner_id === userId ? row.partner_id : row.owner_id,
    swapId: ongoingId,
    kind: "accepted",
    data: { ownerOffer: row.exchange, partnerOffer: row.offering, ownerId: row.owner_id },
  });
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

  // Refund exactly what is held (a requested-but-unconfirmed amount was never taken).
  const deposit = Number(row.deposit_held ?? row.deposit ?? 0);
  const myTurn = (row.awaiting_user_id ?? row.partner_id) === userId;
  db.prepare("DELETE FROM swaps WHERE id = ?").run(swapId);

  if (deposit > 0) {
    db.prepare("UPDATE users SET balance = ROUND(balance + ?, 2) WHERE id = ?").run(
      deposit,
      row.owner_id
    );
    recordLedger(
      db,
      row.owner_id,
      "escrow_release",
      deposit,
      null,
      myTurn ? "Escrow returned — proposal declined" : "Escrow returned — proposal withdrawn"
    );
  }
  logActivity(db, {
    actorId: userId,
    targetId: row.owner_id === userId ? row.partner_id : row.owner_id,
    swapId: null,
    kind: myTurn ? "declined" : "withdrawn",
  });

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

  db.prepare(
    "UPDATE swaps SET awaiting_user_id = ?, last_action_by = ?, counter_count = 0, deposit_held = ? WHERE id = ?"
  ).run(input.partnerId, ownerId, deposit, id);
  db.prepare(
    `INSERT INTO swap_offers (swap_id, author_id, kind, owner_offer, partner_offer, deadline, deposit, message)
     VALUES (?, ?, 'proposal', ?, ?, ?, ?, ?)`
  ).run(id, ownerId, input.exchange, input.offering, deadline, deposit, input.description ?? null);
  if (deposit > 0) {
    recordLedger(db, ownerId, "escrow_hold", deposit, id, `Escrow held for your proposal to ${partner.full_name || "a member"}`);
  }
  logActivity(db, {
    actorId: ownerId,
    targetId: input.partnerId,
    swapId: id,
    kind: "proposal",
    data: { ownerOffer: input.exchange, partnerOffer: input.offering, ownerId },
  });

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
  const stars = Math.round(Number(rating));
  if (!Number.isFinite(stars) || stars < 1 || stars > 5) return null;

  db.prepare("UPDATE swaps SET rating = ? WHERE id = ?").run(
    stars.toFixed(1),
    swapId
  );
  logActivity(db, {
    actorId: userId,
    targetId: row.owner_id === userId ? row.partner_id : row.owner_id,
    swapId,
    kind: "review",
    data: { rating: stars },
  });

  const updated = getParticipantSwap(db, swapId, userId);
  return updated ? formatSwapWithProfile(db, updated, userId) : null;
}

export const MAX_COUNTERS = 10;
const MAX_SKILL_LENGTH = 60;
const MAX_MESSAGE_LENGTH = 500;

export type CounterInput = {
  /** Skill the counter-er will teach. */
  youGive: string;
  /** Skill the counter-er wants to learn. */
  youGet: string;
  /** New end date (YYYY-MM-DD) or empty to keep none. */
  deadline?: string | null;
  /** New escrow amount; omit to keep the current one. */
  deposit?: number | null;
  message?: string | null;
};

export const MAX_ESCROW = 10_000;

/** Thrown for business-rule failures that the API should report verbatim. */
export class SwapActionError extends Error {
  constructor(message: string, public status = 400) {
    super(message);
  }
}

export type CounterResult =
  | { ok: true; swap: ReturnType<typeof formatSwapWithProfile> }
  | { ok: false; status: number; error: string };

function sameText(a: string | null | undefined, b: string | null | undefined) {
  return (a ?? "").trim().toLowerCase() === (b ?? "").trim().toLowerCase();
}

/**
 * Counter a pending proposal with new terms. Only the person whose turn it is
 * may counter; afterwards it becomes the other person's turn. The escrow
 * deposit (held from the original proposer) is not changed by a counter.
 */
export function counterProposal(
  db: DatabaseSync,
  userId: string,
  swapId: string,
  input: CounterInput
): CounterResult {
  const row = getParticipantSwap(db, swapId, userId);
  if (!row || row.type !== "proposal") {
    return { ok: false, status: 404, error: "Proposal not found or already handled." };
  }
  const awaiting = row.awaiting_user_id ?? row.partner_id;
  if (awaiting !== userId) {
    return { ok: false, status: 409, error: "It's the other person's turn to respond." };
  }
  if (Number(row.counter_count ?? 0) >= MAX_COUNTERS) {
    return {
      ok: false,
      status: 409,
      error: `This proposal has reached ${MAX_COUNTERS} counter-offers. Accept or decline it, or chat to agree terms.`,
    };
  }

  const youGive = String(input.youGive ?? "").trim();
  const youGet = String(input.youGet ?? "").trim();
  if (!youGive || !youGet) {
    return { ok: false, status: 400, error: "Enter both the skill you'll teach and the skill you want." };
  }
  if (youGive.length > MAX_SKILL_LENGTH || youGet.length > MAX_SKILL_LENGTH) {
    return { ok: false, status: 400, error: `Skills must be ${MAX_SKILL_LENGTH} characters or fewer.` };
  }

  let deadline: string | null = null;
  const rawDeadline = String(input.deadline ?? "").trim();
  if (rawDeadline) {
    const d = new Date(`${rawDeadline}T23:59:59`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(rawDeadline) || Number.isNaN(d.getTime())) {
      return { ok: false, status: 400, error: "Enter a valid end date." };
    }
    if (d.getTime() < Date.now()) {
      return { ok: false, status: 400, error: "The end date must be in the future." };
    }
    deadline = rawDeadline;
  }

  const message = String(input.message ?? "").trim().slice(0, MAX_MESSAGE_LENGTH) || null;

  const currentDeposit = Number(row.deposit ?? 0);
  const held = Number(row.deposit_held ?? row.deposit ?? 0);
  let deposit = currentDeposit;
  if (input.deposit !== undefined && input.deposit !== null && String(input.deposit) !== "") {
    deposit = Number(input.deposit);
    if (!Number.isFinite(deposit) || deposit < 0 || deposit > MAX_ESCROW) {
      return { ok: false, status: 400, error: `Escrow deposit must be between $0 and $${MAX_ESCROW.toLocaleString()}.` };
    }
    if (Math.round(deposit * 100) !== deposit * 100) {
      return { ok: false, status: 400, error: "Escrow deposit can have at most 2 decimal places." };
    }
  }

  const isOwner = row.owner_id === userId;
  const ownerOffer = isOwner ? youGive : youGet;
  const partnerOffer = isOwner ? youGet : youGive;

  const unchanged =
    sameText(ownerOffer, row.exchange) &&
    sameText(partnerOffer, row.offering) &&
    sameText(deadline, row.deadline) &&
    deposit === currentDeposit;
  if (unchanged) {
    return {
      ok: false,
      status: 400,
      error: "Your counter-offer has the same terms. Change something, or accept the proposal instead.",
    };
  }

  const otherId = isOwner ? row.partner_id! : row.owner_id;
  const me = loadUser(db, userId);
  const myName = me?.full_name || "Your partner";

  // The proposer funds the escrow, so their own counter settles it right away.
  // A recipient's counter only *requests* an amount; it's settled when the
  // proposer accepts (see acceptProposal).
  const escrowDelta = isOwner ? Math.round((deposit - held) * 100) / 100 : 0;
  if (escrowDelta > 0 && Number(me?.balance ?? 0) < escrowDelta) {
    return {
      ok: false,
      status: 402,
      error: `Raising the deposit needs $${escrowDelta.toFixed(2)} more, but your balance is $${Number(me?.balance ?? 0).toFixed(2)}. Add funds first.`,
    };
  }

  db.exec("BEGIN");
  try {
    db.prepare(
      `UPDATE swaps SET
         exchange = ?, offering = ?, deadline = ?,
         awaiting_user_id = ?, last_action_by = ?,
         counter_count = COALESCE(counter_count, 0) + 1,
         received_at = ?, status = 'pending', status_label = 'Countered',
         deposit = ?, deposit_held = ?
       WHERE id = ?`
    ).run(
      ownerOffer,
      partnerOffer,
      deadline,
      otherId,
      userId,
      formatDisplayDate(new Date()),
      deposit,
      isOwner ? deposit : held,
      swapId
    );
    if (escrowDelta !== 0) {
      db.prepare("UPDATE users SET balance = ROUND(balance - ?, 2) WHERE id = ?").run(escrowDelta, userId);
      recordLedger(
        db,
        userId,
        escrowDelta > 0 ? "escrow_hold" : "escrow_release",
        escrowDelta,
        swapId,
        `Escrow changed from $${held.toFixed(2)} to $${deposit.toFixed(2)} in your counter-offer`
      );
    }
    logActivity(db, {
      actorId: userId,
      targetId: otherId,
      swapId,
      kind: "counter",
      data: {
        ownerOffer,
        partnerOffer,
        ownerId: row.owner_id,
        depositChanged: deposit !== currentDeposit,
        depositFrom: currentDeposit,
        depositTo: deposit,
      },
    });
    db.prepare(
      `INSERT INTO swap_offers (swap_id, author_id, kind, owner_offer, partner_offer, deadline, deposit, message)
       VALUES (?, ?, 'counter', ?, ?, ?, ?, ?)`
    ).run(swapId, userId, ownerOffer, partnerOffer, deadline, deposit, message);
    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }

  // Let the other person know in chat (best effort).
  try {
    const conversation = getOrCreateConversation(db, userId, otherId);
    if (conversation) {
      const lines = [
        `Counter-offer from ${myName}:`,
        `• They'll teach: ${youGive}`,
        `• In exchange for: ${youGet}`,
        deadline ? `• End date: ${formatDisplayDate(deadline)}` : null,
        deposit !== currentDeposit
          ? `• Escrow deposit: $${currentDeposit.toFixed(2)} → $${deposit.toFixed(2)}`
          : null,
        message ? `“${message}”` : null,
      ].filter(Boolean);
      sendMessage(db, conversation.id, userId, { text: lines.join("\n") });
    }
  } catch {
    /* notification is optional */
  }

  const updated = getParticipantSwap(db, swapId, userId)!;
  return { ok: true, swap: formatSwapWithProfile(db, updated, userId) };
}

/** Negotiation timeline for a swap, from the viewer's point of view. */
export function getSwapOffers(
  db: DatabaseSync,
  swapId: string,
  viewerId: string
): SwapOfferEntry[] {
  const swap = db.prepare("SELECT owner_id FROM swaps WHERE id = ?").get(swapId) as
    | { owner_id: string }
    | undefined;
  if (!swap) return [];
  const viewerIsOwner = swap.owner_id === viewerId;

  const rows = db
    .prepare(
      `SELECT o.*, u.full_name AS author_name FROM swap_offers o
       LEFT JOIN users u ON u.id = o.author_id
       WHERE o.swap_id = ? ORDER BY o.id ASC`
    )
    .all(swapId) as Array<{
    id: number;
    kind: "proposal" | "counter";
    author_id: string;
    author_name: string | null;
    owner_offer: string | null;
    partner_offer: string | null;
    deadline: string | null;
    deposit: number | null;
    message: string | null;
    created_at: string;
  }>;

  return rows.map((r) => ({
    id: r.id,
    kind: r.kind,
    byYou: r.author_id === viewerId,
    authorName: r.author_id === viewerId ? "You" : r.author_name || "Partner",
    youGive: viewerIsOwner ? r.owner_offer : r.partner_offer,
    youGet: viewerIsOwner ? r.partner_offer : r.owner_offer,
    deadline: r.deadline,
    deposit: r.deposit === null ? null : Number(r.deposit),
    message: r.message,
    createdAt: r.created_at,
  }));
}
