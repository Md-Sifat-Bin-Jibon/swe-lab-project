import type { DatabaseSync } from "node:sqlite";
import { recordLedger } from "@/lib/activity";
import { isGoogleMeetConfigured } from "@/lib/googleMeet";
import { isSmtpConfigured } from "@/lib/mailer";
import { isOpenAIConfigured } from "@/lib/openai";
import { listProjects } from "@/lib/projects";

/** Read-only reporting + moderation queries for the admin panel. */

const num = (v: unknown) => Number(v ?? 0);
const one = <T,>(db: DatabaseSync, sql: string, ...args: unknown[]) =>
  db.prepare(sql).get(...(args as never[])) as T;

export type Paged<T> = { rows: T[]; total: number; page: number; pageSize: number };

function paginate(page: number, pageSize: number) {
  const size = Math.min(Math.max(Math.round(pageSize) || 20, 5), 100);
  const current = Math.max(Math.round(page) || 1, 1);
  return { size, current, offset: (current - 1) * size };
}

// ------------------------------------------------------------- overview ---

export function getOverview(db: DatabaseSync) {
  const since = (days: number) => new Date(Date.now() - days * 86_400_000).toISOString();

  const users = one<{ total: number; verified: number; suspended: number; onboarded: number; browseable: number }>(
    db,
    `SELECT COUNT(*) AS total,
            SUM(CASE WHEN id_verification_status = 'verified' THEN 1 ELSE 0 END) AS verified,
            SUM(CASE WHEN status = 'suspended' THEN 1 ELSE 0 END) AS suspended,
            SUM(CASE WHEN onboarding_complete = 1 THEN 1 ELSE 0 END) AS onboarded,
            SUM(CASE WHEN is_browseable = 1 THEN 1 ELSE 0 END) AS browseable
     FROM users WHERE email NOT LIKE '%@profile.swapspot'`
  );
  const newUsers = num(
    one<{ c: number }>(db, "SELECT COUNT(*) AS c FROM users WHERE created_at >= ?", since(7)).c
  );

  const swaps = one<{ ongoing: number; proposal: number; completed: number; dispute: number }>(
    db,
    `SELECT SUM(CASE WHEN type = 'ongoing' THEN 1 ELSE 0 END) AS ongoing,
            SUM(CASE WHEN type = 'proposal' THEN 1 ELSE 0 END) AS proposal,
            SUM(CASE WHEN type = 'completed' THEN 1 ELSE 0 END) AS completed,
            SUM(CASE WHEN status = 'dispute' THEN 1 ELSE 0 END) AS dispute
     FROM swaps`
  );

  const money = one<{ escrow: number; balances: number }>(
    db,
    `SELECT (SELECT COALESCE(SUM(COALESCE(deposit_held, deposit, 0)), 0) FROM swaps WHERE type IN ('proposal','ongoing')) AS escrow,
            (SELECT COALESCE(SUM(balance), 0) FROM users) AS balances`
  );
  const deposits = one<{ total: number; count: number }>(
    db,
    "SELECT COALESCE(SUM(amount), 0) AS total, COUNT(*) AS count FROM wallet_transactions WHERE type = 'deposit' AND status = 'succeeded'"
  );

  const content = one<{ projects: number; messages: number; conversations: number; tasks: number }>(
    db,
    `SELECT (SELECT COUNT(*) FROM projects) AS projects,
            (SELECT COUNT(*) FROM messages) AS messages,
            (SELECT COUNT(*) FROM conversations) AS conversations,
            (SELECT COUNT(*) FROM swap_tasks) AS tasks`
  );

  const flagged = one<{ week: number; total: number }>(
    db,
    `SELECT COALESCE(SUM(CASE WHEN created_at >= ? THEN 1 ELSE 0 END), 0) AS week, COUNT(*) AS total FROM message_flags`,
    since(7)
  );
  const meetings = one<{ upcoming: number; total: number }>(
    db,
    `SELECT COALESCE(SUM(CASE WHEN status IN ('pending','accepted') AND starts_at >= ? THEN 1 ELSE 0 END), 0) AS upcoming,
            COUNT(*) AS total FROM meetings`,
    new Date().toISOString()
  );

  const pendingVerifications = num(
    one<{ c: number }>(
      db,
      "SELECT COUNT(DISTINCT user_id) AS c FROM id_documents WHERE user_id IN (SELECT id FROM users WHERE id_verification_status != 'verified')"
    ).c
  );

  // Last 6 months of sign-ups, proposals and completed swaps.
  const months: { label: string; key: string; signups: number; proposals: number; completed: number }[] = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      label: d.toLocaleDateString("en-US", { month: "short" }),
      signups: 0,
      proposals: 0,
      completed: 0,
    });
  }
  const bump = (key: string, field: "signups" | "proposals" | "completed") => {
    const m = months.find((x) => x.key === key);
    if (m) m[field] += 1;
  };
  for (const r of db.prepare("SELECT created_at FROM users WHERE created_at IS NOT NULL").all() as {
    created_at: string;
  }[]) {
    bump(String(r.created_at).slice(0, 7), "signups");
  }
  for (const r of db.prepare("SELECT kind, created_at FROM swap_offers WHERE kind = 'proposal'").all() as {
    created_at: string;
  }[]) {
    bump(String(r.created_at).slice(0, 7), "proposals");
  }
  for (const r of db.prepare("SELECT created_at FROM activity_events WHERE kind = 'completed'").all() as {
    created_at: string;
  }[]) {
    bump(String(r.created_at).slice(0, 7), "completed");
  }

  const topSkills = db
    .prepare(
      `SELECT skill, COUNT(*) AS count, kind FROM user_skills GROUP BY lower(skill), kind ORDER BY count DESC LIMIT 20`
    )
    .all() as { skill: string; count: number; kind: string }[];

  return {
    users: {
      total: num(users.total),
      verified: num(users.verified),
      suspended: num(users.suspended),
      onboarded: num(users.onboarded),
      browseable: num(users.browseable),
      newLast7Days: newUsers,
    },
    swaps: {
      ongoing: num(swaps.ongoing),
      proposals: num(swaps.proposal),
      completed: num(swaps.completed),
      disputes: num(swaps.dispute),
    },
    money: {
      escrowHeld: Math.round(num(money.escrow) * 100) / 100,
      memberBalances: Math.round(num(money.balances) * 100) / 100,
      depositsTotal: Math.round(num(deposits.total) * 100) / 100,
      depositsCount: num(deposits.count),
    },
    content: {
      projects: num(content.projects),
      messages: num(content.messages),
      conversations: num(content.conversations),
      tasks: num(content.tasks),
    },
    pendingVerifications,
    moderation: { flaggedLast7Days: num(flagged.week), flaggedTotal: num(flagged.total) },
    meetings: { upcoming: num(meetings.upcoming), total: num(meetings.total) },
    months: months.map(({ label, signups, proposals, completed }) => ({ label, signups, proposals, completed })),
    topOffered: topSkills.filter((s) => s.kind !== "want").slice(0, 6),
    topWanted: topSkills.filter((s) => s.kind === "want").slice(0, 6),
  };
}

// ---------------------------------------------------------------- users ---

export type AdminUserRow = {
  id: string;
  name: string;
  email: string;
  location: string;
  status: string;
  suspendedReason: string | null;
  idVerified: boolean;
  emailVerified: boolean;
  onboarded: boolean;
  browseable: boolean;
  balance: number;
  completedSwaps: number;
  rating: string;
  createdAt: string | null;
  activeSwaps: number;
  projects: number;
};

export function listUsers(
  db: DatabaseSync,
  opts: { search?: string; status?: string; page?: number; pageSize?: number } = {}
): Paged<AdminUserRow> {
  const { size, current, offset } = paginate(opts.page ?? 1, opts.pageSize ?? 20);
  const where: string[] = ["email NOT LIKE '%@profile.swapspot'"];
  const args: unknown[] = [];

  if (opts.search?.trim()) {
    where.push("(lower(full_name) LIKE ? OR lower(email) LIKE ? OR lower(location) LIKE ?)");
    const q = `%${opts.search.trim().toLowerCase()}%`;
    args.push(q, q, q);
  }
  if (opts.status === "suspended") where.push("status = 'suspended'");
  if (opts.status === "verified") where.push("id_verification_status = 'verified'");
  if (opts.status === "unverified") where.push("id_verification_status != 'verified'");
  if (opts.status === "onboarding") where.push("onboarding_complete = 0");

  const clause = `WHERE ${where.join(" AND ")}`;
  const total = num(one<{ c: number }>(db, `SELECT COUNT(*) AS c FROM users ${clause}`, ...args).c);

  const rows = db
    .prepare(
      `SELECT u.*,
        (SELECT COUNT(*) FROM swaps s WHERE s.type = 'ongoing' AND (s.owner_id = u.id OR s.partner_id = u.id)) AS active_swaps,
        (SELECT COUNT(*) FROM projects p WHERE p.user_id = u.id) AS project_count
       FROM users u ${clause}
       ORDER BY COALESCE(u.created_at, '') DESC, u.id DESC
       LIMIT ? OFFSET ?`
    )
    .all(...(args as never[]), size, offset) as Record<string, unknown>[];

  return {
    rows: rows.map((r) => ({
      id: String(r.id),
      name: String(r.full_name || "").trim() || "—",
      email: String(r.email),
      location: String(r.location || ""),
      status: String(r.status || "active"),
      suspendedReason: (r.suspended_reason as string) ?? null,
      idVerified: r.id_verification_status === "verified",
      emailVerified: Boolean(r.email_verified),
      onboarded: Boolean(r.onboarding_complete),
      browseable: Boolean(r.is_browseable),
      balance: num(r.balance),
      completedSwaps: num(r.completed_swaps),
      rating: String(r.rating || "—"),
      createdAt: (r.created_at as string) ?? null,
      activeSwaps: num(r.active_swaps),
      projects: num(r.project_count),
    })),
    total,
    page: current,
    pageSize: size,
  };
}

export function getUserDetail(db: DatabaseSync, userId: string) {
  const row = db.prepare("SELECT * FROM users WHERE id = ?").get(userId) as Record<string, unknown> | undefined;
  if (!row) return null;

  const skills = db.prepare("SELECT skill, kind FROM user_skills WHERE user_id = ? ORDER BY id").all(userId) as {
    skill: string;
    kind: string;
  }[];
  const swaps = db
    .prepare(
      `SELECT id, type, status, status_label, swapping, exchange, offering, deposit, deposit_held, owner_id, partner_id, deadline
       FROM swaps WHERE owner_id = ? OR partner_id = ? ORDER BY rowid DESC LIMIT 25`
    )
    .all(userId, userId) as Record<string, unknown>[];
  const transactions = db
    .prepare("SELECT * FROM wallet_transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT 25")
    .all(userId) as Record<string, unknown>[];
  const documents = db
    .prepare("SELECT side, uploaded_at, size_bytes, mime_type FROM id_documents WHERE user_id = ? ORDER BY side")
    .all(userId) as Record<string, unknown>[];
  const activity = db
    .prepare(
      `SELECT kind, created_at, swap_id FROM activity_events
       WHERE actor_id = ? OR target_id = ? ORDER BY created_at DESC LIMIT 15`
    )
    .all(userId, userId) as Record<string, unknown>[];

  return {
    user: {
      id: String(row.id),
      name: String(row.full_name || "").trim() || "—",
      email: String(row.email),
      phone: String(row.phone || ""),
      location: String(row.location || ""),
      bio: String(row.bio || ""),
      avatar: String(row.avatar || ""),
      status: String(row.status || "active"),
      suspendedReason: (row.suspended_reason as string) ?? null,
      idVerified: row.id_verification_status === "verified",
      idVerifiedAt: (row.id_verified_at as string) ?? null,
      emailVerified: Boolean(row.email_verified),
      onboarded: Boolean(row.onboarding_complete),
      browseable: Boolean(row.is_browseable),
      balance: num(row.balance),
      rating: String(row.rating || "—"),
      completedSwaps: num(row.completed_swaps),
      memberSince: String(row.member_since || ""),
      createdAt: (row.created_at as string) ?? null,
    },
    skills: {
      offer: skills.filter((s) => s.kind !== "want").map((s) => s.skill),
      want: skills.filter((s) => s.kind === "want").map((s) => s.skill),
    },
    swaps: swaps.map((s) => ({
      id: String(s.id),
      type: String(s.type),
      status: String(s.status_label || s.status || ""),
      role: s.owner_id === userId ? "proposer" : "recipient",
      gives: String((s.owner_id === userId ? s.swapping ?? s.exchange : s.exchange ?? s.offering) || ""),
      gets: String((s.owner_id === userId ? s.exchange ?? s.offering : s.swapping ?? s.exchange) || ""),
      deposit: num(s.deposit),
      deadline: (s.deadline as string) ?? null,
    })),
    transactions: transactions.map((t) => ({
      id: String(t.id),
      type: String(t.type),
      amount: num(t.amount),
      status: String(t.status),
      note: (t.note as string) ?? null,
      balanceAfter: t.balance_after === null ? null : num(t.balance_after),
      createdAt: String(t.created_at),
    })),
    documents: documents.map((d) => ({
      side: String(d.side) as "front" | "back",
      uploadedAt: String(d.uploaded_at),
      sizeBytes: num(d.size_bytes),
      mimeType: String(d.mime_type),
    })),
    projects: listProjects(db, userId),
    activity: activity.map((a) => ({
      kind: String(a.kind),
      createdAt: String(a.created_at),
      swapId: (a.swap_id as string) ?? null,
    })),
  };
}

// ------------------------------------------------------------ user actions ---

export function setUserStatus(db: DatabaseSync, userId: string, suspend: boolean, reason: string | null): boolean {
  const user = db.prepare("SELECT id FROM users WHERE id = ?").get(userId);
  if (!user) return false;
  db.prepare("UPDATE users SET status = ?, suspended_reason = ?, is_browseable = CASE WHEN ? THEN 0 ELSE is_browseable END WHERE id = ?")
    .run(suspend ? "suspended" : "active", suspend ? reason : null, suspend ? 1 : 0, userId);
  return true;
}

export function setUserVerification(db: DatabaseSync, userId: string, verified: boolean): boolean {
  const user = db.prepare("SELECT id FROM users WHERE id = ?").get(userId);
  if (!user) return false;
  db.prepare("UPDATE users SET id_verification_status = ?, id_verified_at = ? WHERE id = ?").run(
    verified ? "verified" : "none",
    verified ? new Date().toISOString() : null,
    userId
  );
  return true;
}

export function setUserBrowseable(db: DatabaseSync, userId: string, browseable: boolean): boolean {
  const user = db.prepare("SELECT id FROM users WHERE id = ?").get(userId);
  if (!user) return false;
  db.prepare("UPDATE users SET is_browseable = ? WHERE id = ?").run(browseable ? 1 : 0, userId);
  return true;
}

/** Admin credit/debit. Positive adds funds, negative removes them. */
export function adjustBalance(
  db: DatabaseSync,
  userId: string,
  amount: number,
  note: string
): { ok: true; balance: number } | { ok: false; error: string } {
  const user = db.prepare("SELECT balance FROM users WHERE id = ?").get(userId) as { balance: number } | undefined;
  if (!user) return { ok: false, error: "User not found." };
  const delta = Math.round(Number(amount) * 100) / 100;
  if (!Number.isFinite(delta) || delta === 0) return { ok: false, error: "Enter a non-zero amount." };
  if (Math.abs(delta) > 10_000) return { ok: false, error: "Adjustments are limited to $10,000." };
  const next = Math.round((num(user.balance) + delta) * 100) / 100;
  if (next < 0) return { ok: false, error: "That would make the balance negative." };

  db.prepare("UPDATE users SET balance = ? WHERE id = ?").run(next, userId);
  recordLedger(
    db,
    userId,
    delta > 0 ? "escrow_release" : "escrow_hold",
    delta,
    null,
    `Admin adjustment: ${note || (delta > 0 ? "credit" : "debit")}`
  );
  return { ok: true, balance: next };
}

// ---------------------------------------------------------------- swaps ---

export function listSwaps(
  db: DatabaseSync,
  opts: { search?: string; type?: string; page?: number; pageSize?: number } = {}
) {
  const { size, current, offset } = paginate(opts.page ?? 1, opts.pageSize ?? 20);
  const where: string[] = ["1 = 1"];
  const args: unknown[] = [];
  if (opts.type === "dispute") where.push("s.status = 'dispute'");
  else if (opts.type && opts.type !== "all") {
    where.push("s.type = ?");
    args.push(opts.type);
  }
  if (opts.search?.trim()) {
    const q = `%${opts.search.trim().toLowerCase()}%`;
    where.push(
      "(lower(s.id) LIKE ? OR lower(o.full_name) LIKE ? OR lower(p.full_name) LIKE ? OR lower(COALESCE(s.swapping, s.exchange, '')) LIKE ?)"
    );
    args.push(q, q, q, q);
  }
  const clause = `WHERE ${where.join(" AND ")}`;
  const joins = "FROM swaps s LEFT JOIN users o ON o.id = s.owner_id LEFT JOIN users p ON p.id = s.partner_id";
  const total = num(one<{ c: number }>(db, `SELECT COUNT(*) AS c ${joins} ${clause}`, ...args).c);

  const rows = db
    .prepare(
      `SELECT s.*, o.full_name AS owner_name, p.full_name AS partner_name_full,
              (SELECT COUNT(*) FROM swap_tasks t WHERE t.swap_id = s.id) AS task_count,
              (SELECT COUNT(*) FROM swap_tasks t WHERE t.swap_id = s.id AND t.done = 1) AS task_done
       ${joins} ${clause} ORDER BY s.rowid DESC LIMIT ? OFFSET ?`
    )
    .all(...(args as never[]), size, offset) as Record<string, unknown>[];

  return {
    rows: rows.map((s) => ({
      id: String(s.id),
      type: String(s.type),
      status: String(s.status_label || s.status || ""),
      inDispute: s.status === "dispute",
      owner: { id: String(s.owner_id), name: String(s.owner_name || "—") },
      partner: s.partner_id ? { id: String(s.partner_id), name: String(s.partner_name_full || "—") } : null,
      ownerOffer: String(s.swapping || s.exchange || ""),
      partnerOffer: String(s.exchange || s.offering || ""),
      deposit: num(s.deposit),
      depositHeld: num(s.deposit_held ?? s.deposit),
      counters: num(s.counter_count),
      deadline: (s.deadline as string) ?? null,
      startedAt: (s.started_at as string) ?? null,
      completedAt: (s.completed_at as string) ?? null,
      rating: (s.rating as string) ?? null,
      tasks: { done: num(s.task_done), total: num(s.task_count) },
    })),
    total,
    page: current,
    pageSize: size,
  };
}

export function getSwapDetail(db: DatabaseSync, swapId: string) {
  const swap = db.prepare("SELECT * FROM swaps WHERE id = ?").get(swapId) as Record<string, unknown> | undefined;
  if (!swap) return null;
  const name = (id: unknown) =>
    id
      ? String(
          (db.prepare("SELECT full_name FROM users WHERE id = ?").get(id as string) as { full_name: string } | undefined)
            ?.full_name || "—"
        )
      : "—";

  return {
    swap: {
      ...listSwaps(db, { search: String(swap.id), pageSize: 5 }).rows.find((r) => r.id === swap.id)!,
      description: String(swap.description || ""),
      awaiting: swap.awaiting_user_id ? name(swap.awaiting_user_id) : null,
    },
    offers: (
      db.prepare("SELECT * FROM swap_offers WHERE swap_id = ? ORDER BY id").all(swapId) as Record<string, unknown>[]
    ).map((o) => ({
      kind: String(o.kind),
      author: name(o.author_id),
      ownerOffer: String(o.owner_offer || ""),
      partnerOffer: String(o.partner_offer || ""),
      deposit: o.deposit === null ? null : num(o.deposit),
      deadline: (o.deadline as string) ?? null,
      message: (o.message as string) ?? null,
      createdAt: String(o.created_at),
    })),
    tasks: (
      db.prepare("SELECT * FROM swap_tasks WHERE swap_id = ? ORDER BY assignee_id, position").all(swapId) as Record<
        string,
        unknown
      >[]
    ).map((t) => ({
      assignee: name(t.assignee_id),
      title: String(t.title),
      category: String(t.category),
      dueDate: (t.due_date as string) ?? null,
      done: Boolean(t.done),
      source: String(t.source),
    })),
  };
}

/** Cancel a pending proposal and refund the held escrow. */
export function adminCancelProposal(db: DatabaseSync, swapId: string): { ok: boolean; refunded: number } {
  const row = db.prepare("SELECT * FROM swaps WHERE id = ? AND type = 'proposal'").get(swapId) as
    | Record<string, unknown>
    | undefined;
  if (!row) return { ok: false, refunded: 0 };
  const held = num(row.deposit_held ?? row.deposit);
  db.prepare("DELETE FROM swaps WHERE id = ?").run(swapId);
  if (held > 0) {
    db.prepare("UPDATE users SET balance = ROUND(balance + ?, 2) WHERE id = ?").run(held, row.owner_id);
    recordLedger(db, String(row.owner_id), "escrow_release", held, null, "Escrow returned — proposal cancelled by admin");
  }
  return { ok: true, refunded: held };
}

/**
 * Resolve a dispute: "refund" returns escrow to the proposer and closes the
 * swap, "release" clears the dispute and lets the swap continue.
 */
export function adminResolveDispute(
  db: DatabaseSync,
  swapId: string,
  outcome: "refund" | "release",
  note: string
): { ok: boolean; refunded?: number } {
  const row = db.prepare("SELECT * FROM swaps WHERE id = ? AND type = 'ongoing'").get(swapId) as
    | Record<string, unknown>
    | undefined;
  if (!row) return { ok: false };

  const description = `${row.description ? `${row.description}\n\n` : ""}Admin resolution (${outcome}): ${note || "—"}`;

  if (outcome === "release") {
    db.prepare(
      "UPDATE swaps SET status = 'active', action = 'complete', status_label = 'In progress', description = ? WHERE id = ?"
    ).run(description, swapId);
    return { ok: true };
  }

  const held = num(row.deposit_held ?? row.deposit);
  db.prepare(
    "UPDATE swaps SET status = 'cancelled', action = NULL, status_label = 'Closed by admin', description = ? WHERE id = ?"
  ).run(description, swapId);
  if (held > 0) {
    db.prepare("UPDATE users SET balance = ROUND(balance + ?, 2) WHERE id = ?").run(held, row.owner_id);
    recordLedger(db, String(row.owner_id), "escrow_release", held, swapId, "Escrow returned — dispute resolved by admin");
  }
  return { ok: true, refunded: held };
}

// ------------------------------------------------------- verifications ---

export function listVerifications(db: DatabaseSync, status: string = "pending") {
  const rows = db
    .prepare(
      `SELECT u.id, u.full_name, u.email, u.id_verification_status, u.id_verified_at,
              MAX(d.uploaded_at) AS submitted_at, COUNT(d.id) AS documents
       FROM users u JOIN id_documents d ON d.user_id = u.id
       GROUP BY u.id ORDER BY submitted_at DESC`
    )
    .all() as Record<string, unknown>[];

  return rows
    .map((r) => ({
      userId: String(r.id),
      name: String(r.full_name || "—"),
      email: String(r.email),
      verified: r.id_verification_status === "verified",
      verifiedAt: (r.id_verified_at as string) ?? null,
      submittedAt: String(r.submitted_at),
      documents: num(r.documents),
    }))
    .filter((r) => (status === "all" ? true : status === "verified" ? r.verified : !r.verified));
}

// -------------------------------------------------------------- wallet ---

export function listTransactions(
  db: DatabaseSync,
  opts: { type?: string; search?: string; page?: number; pageSize?: number } = {}
) {
  const { size, current, offset } = paginate(opts.page ?? 1, opts.pageSize ?? 25);
  const where: string[] = ["1 = 1"];
  const args: unknown[] = [];
  if (opts.type && opts.type !== "all") {
    where.push("t.type = ?");
    args.push(opts.type);
  }
  if (opts.search?.trim()) {
    const q = `%${opts.search.trim().toLowerCase()}%`;
    where.push("(lower(u.full_name) LIKE ? OR lower(u.email) LIKE ? OR lower(t.id) LIKE ?)");
    args.push(q, q, q);
  }
  const clause = `WHERE ${where.join(" AND ")}`;
  const joins = "FROM wallet_transactions t LEFT JOIN users u ON u.id = t.user_id";
  const total = num(one<{ c: number }>(db, `SELECT COUNT(*) AS c ${joins} ${clause}`, ...args).c);
  const totals = one<{ deposits: number; holds: number; releases: number }>(
    db,
    `SELECT
       COALESCE(SUM(CASE WHEN t.type = 'deposit' AND t.status = 'succeeded' THEN t.amount END), 0) AS deposits,
       COALESCE(SUM(CASE WHEN t.type = 'escrow_hold' THEN t.amount END), 0) AS holds,
       COALESCE(SUM(CASE WHEN t.type IN ('escrow_release','escrow_refund') THEN t.amount END), 0) AS releases
     ${joins} ${clause}`,
    ...args
  );

  const rows = db
    .prepare(`SELECT t.*, u.full_name AS user_name, u.email AS user_email ${joins} ${clause} ORDER BY t.created_at DESC LIMIT ? OFFSET ?`)
    .all(...(args as never[]), size, offset) as Record<string, unknown>[];

  return {
    rows: rows.map((t) => ({
      id: String(t.id),
      user: { id: String(t.user_id), name: String(t.user_name || "—"), email: String(t.user_email || "") },
      type: String(t.type),
      amount: num(t.amount),
      status: String(t.status),
      card: t.card_brand ? `${t.card_brand} •••• ${t.card_last4}` : null,
      note: (t.note as string) ?? null,
      swapId: (t.swap_id as string) ?? null,
      failureReason: (t.failure_reason as string) ?? null,
      balanceAfter: t.balance_after === null ? null : num(t.balance_after),
      createdAt: String(t.created_at),
    })),
    total,
    page: current,
    pageSize: size,
    totals: {
      deposits: Math.round(num(totals.deposits) * 100) / 100,
      holds: Math.round(num(totals.holds) * 100) / 100,
      releases: Math.round(num(totals.releases) * 100) / 100,
    },
  };
}

// ------------------------------------------------------------ projects ---

export function listAllProjects(db: DatabaseSync, opts: { search?: string; page?: number; pageSize?: number } = {}) {
  const { size, current, offset } = paginate(opts.page ?? 1, opts.pageSize ?? 24);
  const where: string[] = ["1 = 1"];
  const args: unknown[] = [];
  if (opts.search?.trim()) {
    const q = `%${opts.search.trim().toLowerCase()}%`;
    where.push("(lower(p.title) LIKE ? OR lower(p.description) LIKE ? OR lower(u.full_name) LIKE ?)");
    args.push(q, q, q);
  }
  const clause = `WHERE ${where.join(" AND ")}`;
  const joins = "FROM projects p LEFT JOIN users u ON u.id = p.user_id";
  const total = num(one<{ c: number }>(db, `SELECT COUNT(*) AS c ${joins} ${clause}`, ...args).c);
  const rows = db
    .prepare(`SELECT p.*, u.full_name AS owner_name ${joins} ${clause} ORDER BY p.created_at DESC LIMIT ? OFFSET ?`)
    .all(...(args as never[]), size, offset) as Record<string, unknown>[];

  return {
    rows: rows.map((p) => ({
      id: String(p.id),
      userId: String(p.user_id),
      owner: String(p.owner_name || "—"),
      title: String(p.title),
      description: String(p.description || ""),
      skill: (p.skill as string) ?? null,
      tags: JSON.parse(String(p.tags || "[]")) as string[],
      images: JSON.parse(String(p.images || "[]")) as string[],
      projectUrl: (p.project_url as string) ?? null,
      createdAt: String(p.created_at),
    })),
    total,
    page: current,
    pageSize: size,
  };
}

// ---------------------------------------------------------------- chat ---

export function listConversations(db: DatabaseSync, search?: string) {
  const rows = db
    .prepare(
      `SELECT c.id, c.user_one_id, c.user_two_id, c.updated_at,
              a.full_name AS one_name, b.full_name AS two_name,
              (SELECT COUNT(*) FROM messages m WHERE m.conversation_id = c.id) AS message_count,
              (SELECT m.text FROM messages m WHERE m.conversation_id = c.id ORDER BY m.id DESC LIMIT 1) AS last_text
       FROM conversations c
       LEFT JOIN users a ON a.id = c.user_one_id
       LEFT JOIN users b ON b.id = c.user_two_id
       ORDER BY COALESCE(c.updated_at, '') DESC`
    )
    .all() as Record<string, unknown>[];

  const q = search?.trim().toLowerCase();
  return rows
    .map((c) => ({
      id: String(c.id),
      participants: [String(c.one_name || "—"), String(c.two_name || "—")],
      messageCount: num(c.message_count),
      lastMessage: String(c.last_text || "").slice(0, 120),
      updatedAt: (c.updated_at as string) ?? null,
    }))
    .filter((c) => !q || c.participants.join(" ").toLowerCase().includes(q) || c.lastMessage.toLowerCase().includes(q));
}

export function listMessages(db: DatabaseSync, conversationId: string) {
  return (
    db
      .prepare(
        `SELECT m.*, u.full_name AS sender_name FROM messages m
         LEFT JOIN users u ON u.id = m.sender_id
         WHERE m.conversation_id = ? ORDER BY m.id ASC LIMIT 500`
      )
      .all(conversationId) as Record<string, unknown>[]
  ).map((m) => ({
    id: num(m.id),
    sender: String(m.sender_name || "Member"),
    text: String(m.text || ""),
    type: String(m.message_type || "text"),
    mediaUrl: (m.media_url as string) ?? null,
    createdAt: String(m.created_at),
  }));
}

// ---------------------------------------------------------- moderation ---

export function listFlags(db: DatabaseSync, opts: { kind?: string; page?: number; pageSize?: number } = {}) {
  const { size, current, offset } = paginate(opts.page ?? 1, opts.pageSize ?? 30);
  const where = opts.kind && opts.kind !== "all" ? "WHERE f.kind = ?" : "";
  const args = opts.kind && opts.kind !== "all" ? [opts.kind] : [];
  const total = num(one<{ c: number }>(db, `SELECT COUNT(*) AS c FROM message_flags f ${where}`, ...args).c);
  const rows = db
    .prepare(
      `SELECT f.*, u.full_name AS user_name, u.email AS user_email
       FROM message_flags f LEFT JOIN users u ON u.id = f.user_id
       ${where} ORDER BY f.created_at DESC LIMIT ? OFFSET ?`
    )
    .all(...(args as never[]), size, offset) as Record<string, unknown>[];

  return {
    rows: rows.map((f) => ({
      id: num(f.id),
      user: { id: String(f.user_id), name: String(f.user_name || "—"), email: String(f.user_email || "") },
      kind: String(f.kind),
      excerpt: String(f.excerpt),
      source: String(f.source),
      context: String(f.context),
      conversationId: (f.conversation_id as string) ?? null,
      messageId: f.message_id === null ? null : num(f.message_id),
      originalText: (f.original_text as string) ?? null,
      createdAt: String(f.created_at),
    })),
    total,
    page: current,
    pageSize: size,
  };
}

// ------------------------------------------------------------ meetings ---

export function listMeetingsAdmin(db: DatabaseSync, opts: { status?: string; page?: number; pageSize?: number } = {}) {
  const { size, current, offset } = paginate(opts.page ?? 1, opts.pageSize ?? 25);
  const where: string[] = ["1 = 1"];
  const args: unknown[] = [];
  if (opts.status === "upcoming") {
    where.push("m.status IN ('pending','accepted') AND m.starts_at >= ?");
    args.push(new Date().toISOString());
  } else if (opts.status && opts.status !== "all") {
    where.push("m.status = ?");
    args.push(opts.status);
  }

  const clause = `WHERE ${where.join(" AND ")}`;
  const joins = "FROM meetings m LEFT JOIN users o ON o.id = m.organizer_id LEFT JOIN users i ON i.id = m.invitee_id";
  const total = num(one<{ c: number }>(db, `SELECT COUNT(*) AS c ${joins} ${clause}`, ...args).c);
  const rows = db
    .prepare(`SELECT m.*, o.full_name AS organizer_name, i.full_name AS invitee_name ${joins} ${clause} ORDER BY m.starts_at DESC LIMIT ? OFFSET ?`)
    .all(...(args as never[]), size, offset) as Record<string, unknown>[];

  return {
    rows: rows.map((m) => ({
      id: String(m.id),
      title: String(m.title),
      organizer: { id: String(m.organizer_id), name: String(m.organizer_name || "—") },
      invitee: { id: String(m.invitee_id), name: String(m.invitee_name || "—") },
      startsAt: String(m.starts_at),
      durationMinutes: num(m.duration_minutes),
      status: String(m.status),
      provider: String(m.provider),
      joinUrl: (m.join_url as string) ?? null,
      swapId: (m.swap_id as string) ?? null,
      linkError: (m.link_error as string) ?? null,
      createdAt: String(m.created_at),
    })),
    total,
    page: current,
    pageSize: size,
  };
}

// ------------------------------------------------------- activity/audit ---

export function listPlatformActivity(db: DatabaseSync, opts: { kind?: string; page?: number; pageSize?: number } = {}) {
  const { size, current, offset } = paginate(opts.page ?? 1, opts.pageSize ?? 30);
  const where = opts.kind && opts.kind !== "all" ? "WHERE e.kind = ?" : "";
  const args = opts.kind && opts.kind !== "all" ? [opts.kind] : [];
  const total = num(one<{ c: number }>(db, `SELECT COUNT(*) AS c FROM activity_events e ${where}`, ...args).c);
  const rows = db
    .prepare(
      `SELECT e.*, a.full_name AS actor_name, t.full_name AS target_name
       FROM activity_events e
       LEFT JOIN users a ON a.id = e.actor_id
       LEFT JOIN users t ON t.id = e.target_id
       ${where} ORDER BY e.created_at DESC LIMIT ? OFFSET ?`
    )
    .all(...(args as never[]), size, offset) as Record<string, unknown>[];

  return {
    rows: rows.map((e) => ({
      id: num(e.id),
      kind: String(e.kind),
      actor: String(e.actor_name || "—"),
      target: (e.target_name as string) ?? null,
      swapId: (e.swap_id as string) ?? null,
      data: e.data ? (JSON.parse(String(e.data)) as Record<string, unknown>) : null,
      createdAt: String(e.created_at),
    })),
    total,
    page: current,
    pageSize: size,
  };
}

export function listAuditLog(db: DatabaseSync, opts: { page?: number; pageSize?: number } = {}) {
  const { size, current, offset } = paginate(opts.page ?? 1, opts.pageSize ?? 30);
  const total = num(one<{ c: number }>(db, "SELECT COUNT(*) AS c FROM admin_actions").c);
  const rows = db
    .prepare(
      `SELECT l.*, a.email AS admin_email FROM admin_actions l
       LEFT JOIN admins a ON a.id = l.admin_id
       ORDER BY l.created_at DESC LIMIT ? OFFSET ?`
    )
    .all(size, offset) as Record<string, unknown>[];
  return {
    rows: rows.map((l) => ({
      id: num(l.id),
      admin: String(l.admin_email || l.admin_id),
      action: String(l.action),
      targetType: (l.target_type as string) ?? null,
      targetId: (l.target_id as string) ?? null,
      detail: (l.detail as string) ?? null,
      createdAt: String(l.created_at),
    })),
    total,
    page: current,
    pageSize: size,
  };
}

// ------------------------------------------------------------ settings ---

export function getSystemInfo(db: DatabaseSync) {
  const counts = one<Record<string, number>>(
    db,
    `SELECT (SELECT COUNT(*) FROM users) AS users, (SELECT COUNT(*) FROM swaps) AS swaps,
            (SELECT COUNT(*) FROM messages) AS messages, (SELECT COUNT(*) FROM projects) AS projects,
            (SELECT COUNT(*) FROM wallet_transactions) AS transactions,
            (SELECT COUNT(*) FROM activity_events) AS events,
            (SELECT COUNT(*) FROM swap_tasks) AS tasks, (SELECT COUNT(*) FROM id_documents) AS documents,
            (SELECT COUNT(*) FROM meetings) AS meetings, (SELECT COUNT(*) FROM message_flags) AS flags`
  );
  const admins = (
    db.prepare("SELECT id, email, name, role, created_at, last_login_at FROM admins ORDER BY created_at").all() as Record<
      string,
      unknown
    >[]
  ).map((a) => ({
    id: String(a.id),
    email: String(a.email),
    name: String(a.name || ""),
    role: String(a.role),
    createdAt: String(a.created_at),
    lastLoginAt: (a.last_login_at as string) ?? null,
  }));

  return {
    integrations: {
      smtp: isSmtpConfigured(),
      openai: isOpenAIConfigured(),
      googleMeet: isGoogleMeetConfigured(),
      openaiModel: process.env.OPENAI_MODEL?.trim() || "gpt-4.1-mini",
      appUrl: process.env.APP_URL || "http://localhost:3000",
    },
    counts,
    admins,
    node: process.version,
    environment: process.env.NODE_ENV || "development",
  };
}
