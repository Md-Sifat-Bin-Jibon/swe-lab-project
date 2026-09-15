import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { seedRealtimeChat } from "@/lib/chat";
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
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS user_skills (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    skill TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS otp_codes (
    email TEXT PRIMARY KEY,
    code TEXT NOT NULL,
    expires_at TEXT NOT NULL
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

function migrateSchema(db: DatabaseSync): void {
  if (!columnExists(db, "swaps", "deposit")) {
    db.exec("ALTER TABLE swaps ADD COLUMN deposit REAL DEFAULT 0");
  }

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
       WHERE id = 'proposal-neha'`
    ).run(demo.id);
    db.prepare(
      `UPDATE swaps
       SET owner_id = 'eric', partner_id = ?, partner_name = 'Dwiky Ahmad',
           exchange = 'Graphic Design', offering = 'Marketing', deposit = 0,
           status = 'pending', status_label = 'Pending'
       WHERE id = 'proposal-eric'`
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
}

export function getDb(): DatabaseSync {
  const g = globalThis as GlobalDb;

  if (!g.__swapspotDb) {
    g.__swapspotDb = createDatabase();
  } else {
    migrateSchema(g.__swapspotDb);
  }

  if (!g.__swapspotDbReady) {
    ensureSeeded(g.__swapspotDb);
    g.__swapspotDbReady = true;
  }

  return g.__swapspotDb;
}
