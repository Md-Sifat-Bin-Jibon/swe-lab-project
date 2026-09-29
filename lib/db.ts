import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { seedRealtimeChat } from "@/lib/chat";
import { ensureAdminSeed } from "@/lib/adminSeed";
import { seedSampleProjects } from "@/lib/projects";
import { seedDatabase } from "@/lib/seed";

const SCHEMA = `
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name TEXT,
    phone TEXT,
    location TEXT,
    bio TEXT,
    avatar TEXT,
    balance INTEGER NOT NULL DEFAULT 157,
    available INTEGER NOT NULL DEFAULT 1,
    rating TEXT NOT NULL DEFAULT '4.5 (0)',
    member_since TEXT,
    completed_swaps INTEGER NOT NULL DEFAULT 0,
    offer_skill TEXT,
    want_skill TEXT,
    is_browseable INTEGER NOT NULL DEFAULT 0,
    email_verified INTEGER NOT NULL DEFAULT 0,
    onboarding_complete INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'active',
    suspended_reason TEXT,
    id_verification_status TEXT NOT NULL DEFAULT 'none',
    id_verified_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS user_skills (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    skill TEXT NOT NULL,
    kind TEXT NOT NULL DEFAULT 'offer' CHECK(kind IN ('offer', 'want')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS otp_codes (
    email TEXT PRIMARY KEY,
    code TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    attempts INTEGER NOT NULL DEFAULT 0,
    last_sent_at TEXT
  );

  CREATE TABLE IF NOT EXISTS swaps (
    id TEXT PRIMARY KEY,
    owner_id TEXT NOT NULL,
    partner_id TEXT,
    type TEXT NOT NULL CHECK(type IN ('ongoing', 'proposal', 'completed')),
    swapping TEXT,
    exchange TEXT,
    offering TEXT,
    swapped TEXT,
    partner_name TEXT,
    timer TEXT,
    action TEXT,
    status TEXT,
    status_label TEXT,
    started_at TEXT,
    deadline TEXT,
    received_at TEXT,
    completed_at TEXT,
    rating TEXT,
    description TEXT,
    deposit REAL DEFAULT 0,
    awaiting_user_id TEXT,
    counter_count INTEGER NOT NULL DEFAULT 0,
    last_action_by TEXT,
    tasks_status TEXT,
    tasks_error TEXT,
    deposit_held REAL,
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (partner_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS conversations (
    id TEXT PRIMARY KEY,
    user_one_id TEXT,
    user_two_id TEXT,
    owner_id TEXT,
    participant_name TEXT,
    participant_avatar TEXT,
    participant_initials TEXT,
    preview TEXT,
    last_message TEXT,
    time_label TEXT,
    updated_at TEXT DEFAULT (datetime('now')),
    unread INTEGER NOT NULL DEFAULT 0,
    unread_one INTEGER NOT NULL DEFAULT 0,
    unread_two INTEGER NOT NULL DEFAULT 0,
    online INTEGER NOT NULL DEFAULT 0,
    is_active INTEGER NOT NULL DEFAULT 0,
    typing_one_at TEXT,
    typing_two_at TEXT
  );

  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    conversation_id TEXT NOT NULL,
    sender_id TEXT,
    direction TEXT CHECK(direction IN ('incoming', 'outgoing')),
    text TEXT NOT NULL,
    time_label TEXT,
    quote TEXT,
    message_type TEXT NOT NULL DEFAULT 'text',
    media_url TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS swap_tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    swap_id TEXT NOT NULL,
    assignee_id TEXT NOT NULL,
    title TEXT NOT NULL,
    detail TEXT,
    category TEXT NOT NULL DEFAULT 'learn' CHECK(category IN ('teach', 'learn', 'together')),
    due_date TEXT,
    position INTEGER NOT NULL DEFAULT 0,
    done INTEGER NOT NULL DEFAULT 0,
    done_at TEXT,
    source TEXT NOT NULL DEFAULT 'ai' CHECK(source IN ('ai', 'template', 'manual')),
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS swap_offers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    swap_id TEXT NOT NULL,
    author_id TEXT NOT NULL,
    kind TEXT NOT NULL CHECK(kind IN ('proposal', 'counter')),
    owner_offer TEXT,
    partner_offer TEXT,
    deadline TEXT,
    deposit REAL,
    message TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS id_documents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    side TEXT NOT NULL CHECK(side IN ('front', 'back')),
    file_path TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    size_bytes INTEGER NOT NULL,
    uploaded_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS meetings (
    id TEXT PRIMARY KEY,
    swap_id TEXT,
    conversation_id TEXT,
    organizer_id TEXT NOT NULL,
    invitee_id TEXT NOT NULL,
    title TEXT NOT NULL,
    agenda TEXT,
    starts_at TEXT NOT NULL,
    duration_minutes INTEGER NOT NULL DEFAULT 30,
    status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'accepted', 'declined', 'cancelled')),
    join_url TEXT,
    provider TEXT NOT NULL DEFAULT 'fallback',
    google_event_id TEXT,
    link_error TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    responded_at TEXT,
    FOREIGN KEY (organizer_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (invitee_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS message_flags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    message_id INTEGER,
    conversation_id TEXT,
    user_id TEXT NOT NULL,
    context TEXT NOT NULL DEFAULT 'chat',
    kind TEXT NOT NULL,
    excerpt TEXT NOT NULL,
    source TEXT NOT NULL DEFAULT 'rules' CHECK(source IN ('rules', 'ai')),
    original_text TEXT,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS admins (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT,
    role TEXT NOT NULL DEFAULT 'admin' CHECK(role IN ('admin', 'owner')),
    created_at TEXT NOT NULL,
    last_login_at TEXT
  );

  CREATE TABLE IF NOT EXISTS admin_actions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    admin_id TEXT NOT NULL,
    action TEXT NOT NULL,
    target_type TEXT,
    target_id TEXT,
    detail TEXT,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    skill TEXT,
    tags TEXT NOT NULL DEFAULT '[]',
    images TEXT NOT NULL DEFAULT '[]',
    project_url TEXT,
    duration TEXT,
    completed_on TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS activity_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    actor_id TEXT NOT NULL,
    target_id TEXT,
    swap_id TEXT,
    kind TEXT NOT NULL,
    data TEXT,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS wallet_transactions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('deposit', 'escrow_hold', 'escrow_release', 'escrow_refund')),
    swap_id TEXT,
    note TEXT,
    amount REAL NOT NULL,
    status TEXT NOT NULL CHECK(status IN ('succeeded', 'declined')),
    card_brand TEXT,
    card_last4 TEXT,
    failure_reason TEXT,
    balance_after REAL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS message_reactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    message_id INTEGER NOT NULL,
    user_id TEXT NOT NULL,
    emoji TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(message_id, user_id, emoji),
    FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );
`;

type GlobalDb = typeof globalThis & {
  __swapspotDb?: DatabaseSync;
  __swapspotDbReady?: boolean;
};

function columnExists(db: DatabaseSync, table: string, column: string): boolean {
  const rows = db.prepare(`PRAGMA table_info(${table})`).all() as {
    name: string;
  }[];
  return rows.some((row) => row.name === column);
}

/** One-time: seed the activity log from data that existed before it. */
function backfillActivity(db: DatabaseSync): void {
  const has = db.prepare("SELECT 1 FROM activity_events LIMIT 1").get();
  if (has) return;
  const toIso = (v: string) => (v.includes("T") ? v : `${v.replace(" ", "T")}Z`);
  const insert = db.prepare(
    "INSERT INTO activity_events (actor_id, target_id, swap_id, kind, data, created_at) VALUES (?, ?, ?, ?, ?, ?)"
  );

  const offers = db
    .prepare(
      `SELECT o.swap_id, o.author_id, o.kind, o.owner_offer, o.partner_offer, o.created_at,
              s.owner_id, s.partner_id
       FROM swap_offers o JOIN swaps s ON s.id = o.swap_id`
    )
    .all() as Array<Record<string, string>>;
  for (const o of offers) {
    const target = o.author_id === o.owner_id ? o.partner_id : o.owner_id;
    insert.run(
      o.author_id,
      target,
      o.swap_id,
      o.kind,
      JSON.stringify({ ownerOffer: o.owner_offer, partnerOffer: o.partner_offer, ownerId: o.owner_id }),
      toIso(o.created_at)
    );
  }

  const topups = db
    .prepare("SELECT user_id, amount, card_brand, card_last4, created_at FROM wallet_transactions WHERE type = 'deposit' AND status = 'succeeded'")
    .all() as Array<Record<string, string | number>>;
  for (const t of topups) {
    insert.run(t.user_id, null, null, "topup", JSON.stringify({ amount: t.amount, card: `${t.card_brand} •••• ${t.card_last4}` }), toIso(String(t.created_at)));
  }

  const verified = db
    .prepare("SELECT id, id_verified_at FROM users WHERE id_verification_status = 'verified' AND id_verified_at IS NOT NULL")
    .all() as Array<{ id: string; id_verified_at: string }>;
  for (const v of verified) insert.run(v.id, null, null, "id_verified", null, toIso(v.id_verified_at));
}

function migrateSchema(db: DatabaseSync): void {
  // Every statement in SCHEMA is CREATE TABLE IF NOT EXISTS, so re-running it
  // adds tables introduced after this database was first created (e.g. while
  // a dev server is already running) and is a no-op otherwise.
  db.exec(SCHEMA);

  if (!columnExists(db, "swaps", "deposit")) {
    db.exec("ALTER TABLE swaps ADD COLUMN deposit REAL DEFAULT 0");
  }
  if (!columnExists(db, "swaps", "awaiting_user_id")) {
    db.exec("ALTER TABLE swaps ADD COLUMN awaiting_user_id TEXT");
  }
  if (!columnExists(db, "swaps", "counter_count")) {
    db.exec("ALTER TABLE swaps ADD COLUMN counter_count INTEGER NOT NULL DEFAULT 0");
  }
  if (!columnExists(db, "swaps", "last_action_by")) {
    db.exec("ALTER TABLE swaps ADD COLUMN last_action_by TEXT");
  }
  // Widen wallet_transactions to an escrow-aware ledger (SQLite can't alter a
  // CHECK constraint, so rebuild the table once, keeping existing rows).
  const walletSql = (
    db.prepare("SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'wallet_transactions'").get() as
      | { sql: string }
      | undefined
  )?.sql;
  if (walletSql && !walletSql.includes("escrow_hold")) {
    db.exec(`
      BEGIN;
      ALTER TABLE wallet_transactions RENAME TO wallet_transactions_old;
      CREATE TABLE wallet_transactions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        type TEXT NOT NULL CHECK(type IN ('deposit', 'escrow_hold', 'escrow_release', 'escrow_refund')),
        swap_id TEXT,
        note TEXT,
        amount REAL NOT NULL,
        status TEXT NOT NULL CHECK(status IN ('succeeded', 'declined')),
        card_brand TEXT,
        card_last4 TEXT,
        failure_reason TEXT,
        balance_after REAL,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
      INSERT INTO wallet_transactions
        (id, user_id, type, amount, status, card_brand, card_last4, failure_reason, balance_after, created_at)
        SELECT id, user_id, type, amount, status, card_brand, card_last4, failure_reason, balance_after, created_at
        FROM wallet_transactions_old;
      DROP TABLE wallet_transactions_old;
      COMMIT;
    `);
  }

  if (!columnExists(db, "swaps", "deposit_held")) {
    db.exec("ALTER TABLE swaps ADD COLUMN deposit_held REAL");
  }
  // Escrow actually taken from the proposer; before counters could change the
  // amount, it always equalled the deposit.
  db.exec("UPDATE swaps SET deposit_held = COALESCE(deposit, 0) WHERE deposit_held IS NULL");
  if (!columnExists(db, "swap_offers", "deposit")) {
    db.exec("ALTER TABLE swap_offers ADD COLUMN deposit REAL");
  }

  if (!columnExists(db, "swaps", "tasks_status")) {
    db.exec("ALTER TABLE swaps ADD COLUMN tasks_status TEXT");
  }
  if (!columnExists(db, "swaps", "tasks_error")) {
    db.exec("ALTER TABLE swaps ADD COLUMN tasks_error TEXT");
  }
  // Existing proposals: the recipient is the one who must respond.
  db.exec(
    `UPDATE swaps SET awaiting_user_id = partner_id, last_action_by = owner_id
     WHERE type = 'proposal' AND awaiting_user_id IS NULL`
  );

  const conversationColumns: Array<[string, string]> = [
    ["user_one_id", "TEXT"],
    ["user_two_id", "TEXT"],
    ["last_message", "TEXT"],
    ["updated_at", "TEXT"],
    ["unread_one", "INTEGER NOT NULL DEFAULT 0"],
    ["unread_two", "INTEGER NOT NULL DEFAULT 0"],
    ["typing_one_at", "TEXT"],
    ["typing_two_at", "TEXT"],
  ];
  for (const [name, type] of conversationColumns) {
    if (!columnExists(db, "conversations", name)) {
      db.exec(`ALTER TABLE conversations ADD COLUMN ${name} ${type}`);
    }
  }

  if (!columnExists(db, "users", "status")) {
    db.exec("ALTER TABLE users ADD COLUMN status TEXT NOT NULL DEFAULT 'active'");
  }
  if (!columnExists(db, "users", "suspended_reason")) {
    db.exec("ALTER TABLE users ADD COLUMN suspended_reason TEXT");
  }

  if (!columnExists(db, "users", "id_verification_status")) {
    db.exec(
      "ALTER TABLE users ADD COLUMN id_verification_status TEXT NOT NULL DEFAULT 'none'"
    );
  }
  if (!columnExists(db, "users", "id_verified_at")) {
    db.exec("ALTER TABLE users ADD COLUMN id_verified_at TEXT");
  }

  if (!columnExists(db, "user_skills", "kind")) {
    db.exec(
      "ALTER TABLE user_skills ADD COLUMN kind TEXT NOT NULL DEFAULT 'offer'"
    );
    // Old rows had no type: the only reliably-known "want" was users.want_skill.
    db.exec(`
      UPDATE user_skills SET kind = 'want'
      WHERE lower(skill) = lower(
        (SELECT want_skill FROM users WHERE users.id = user_skills.user_id)
      )
      AND lower(skill) != lower(
        COALESCE((SELECT offer_skill FROM users WHERE users.id = user_skills.user_id), '')
      )
    `);
    // Make sure every user's primary want_skill exists as a "want" row
    // (it was often only stored on the users table).
    db.exec(`
      INSERT INTO user_skills (user_id, skill, kind)
      SELECT u.id, u.want_skill, 'want' FROM users u
      WHERE u.want_skill IS NOT NULL AND trim(u.want_skill) != ''
        AND NOT EXISTS (
          SELECT 1 FROM user_skills s
          WHERE s.user_id = u.id AND s.kind = 'want'
            AND lower(s.skill) = lower(u.want_skill)
        )
    `);
  }

  if (!columnExists(db, "otp_codes", "attempts")) {
    db.exec("ALTER TABLE otp_codes ADD COLUMN attempts INTEGER NOT NULL DEFAULT 0");
  }
  if (!columnExists(db, "otp_codes", "last_sent_at")) {
    db.exec("ALTER TABLE otp_codes ADD COLUMN last_sent_at TEXT");
  }

  if (!columnExists(db, "messages", "sender_id")) {
    db.exec("ALTER TABLE messages ADD COLUMN sender_id TEXT");
  }
  if (!columnExists(db, "messages", "media_url")) {
    db.exec("ALTER TABLE messages ADD COLUMN media_url TEXT");
  }

  db.exec(`
    CREATE TABLE IF NOT EXISTS message_reactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      message_id INTEGER NOT NULL,
      user_id TEXT NOT NULL,
      emoji TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(message_id, user_id, emoji),
      FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  backfillActivity(db);
  seedSampleProjects(db);
  ensureAdminSeed(db);

  // Backfill demo deposits for existing local DBs created before deposit existed.
  const defaults: Array<[string, number]> = [
    ["ongoing-eric", 50],
    ["ongoing-boston", 40],
    ["proposal-neha", 50],
    ["proposal-eric", 35],
    ["completed-neha", 50],
    ["completed-boston", 25],
  ];
  const update = db.prepare(
    "UPDATE swaps SET deposit = ? WHERE id = ? AND (deposit IS NULL OR deposit = 0)"
  );
  for (const [id, amount] of defaults) {
    update.run(amount, id);
  }

  // Real accounts that finished onboarding should appear in Browse for other users.
  db.exec(
    `UPDATE users
     SET is_browseable = 1, available = 1
     WHERE onboarding_complete = 1
       AND lower(email) NOT LIKE '%@profile.swapspot'`
  );

  // Seed proposals should be incoming to the demo user (NPC → demo).
  const demo = db
    .prepare("SELECT id FROM users WHERE id = ?")
    .get("demo-user") as { id: string } | undefined;
  if (demo) {
    db.prepare(
      `UPDATE swaps
       SET owner_id = 'neha', partner_id = ?, partner_name = 'Dwiky Ahmad',
           exchange = 'Photography', offering = 'UI Design', deposit = 0,
           status = 'pending', status_label = 'Pending'
       WHERE id = 'proposal-neha' AND counter_count = 0`
    ).run(demo.id);
    db.prepare(
      `UPDATE swaps
       SET owner_id = 'eric', partner_id = ?, partner_name = 'Dwiky Ahmad',
           exchange = 'Graphic Design', offering = 'Marketing', deposit = 0,
           status = 'pending', status_label = 'Pending'
       WHERE id = 'proposal-eric' AND counter_count = 0`
    ).run(demo.id);
  }
}

function createDatabase(): DatabaseSync {
  const dataDir = path.join(process.cwd(), "data");
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const dbPath = path.join(dataDir, "swapspot.db");
  const db = new DatabaseSync(dbPath);
  db.exec("PRAGMA journal_mode = WAL");
  db.exec("PRAGMA foreign_keys = ON");
  db.exec(SCHEMA);
  migrateSchema(db);
  return db;
}

function ensureSeeded(db: DatabaseSync): void {
  const demo = db
    .prepare("SELECT id FROM users WHERE id = ?")
    .get("demo-user") as { id: string } | undefined;

  if (!demo) {
    seedDatabase(db);
  }

  // Ensure shared chat schema seed exists even on older DBs.
  const demoId = demo?.id ?? "demo-user";
  seedRealtimeChat(db, demoId);
  seedSampleProjects(db);
}

/** Reset on every module (re)load, so updated code migrates exactly once. */
let migratedThisModule = false;

export function getDb(): DatabaseSync {
  const g = globalThis as GlobalDb;

  if (!g.__swapspotDb) {
    g.__swapspotDb = createDatabase();
    migratedThisModule = true;
  } else if (!migratedThisModule) {
    // The connection outlives hot reloads; migrate once per code version
    // instead of on every request.
    migrateSchema(g.__swapspotDb);
    migratedThisModule = true;
  }

  if (!g.__swapspotDbReady) {
    ensureSeeded(g.__swapspotDb);
    g.__swapspotDbReady = true;
  }

  return g.__swapspotDb;
}
