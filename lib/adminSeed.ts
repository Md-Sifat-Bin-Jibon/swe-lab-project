import bcrypt from "bcryptjs";
import type { DatabaseSync } from "node:sqlite";

/**
 * Creates the first admin from ADMIN_EMAIL / ADMIN_PASSWORD (or demo defaults)
 * so the panel is reachable on a fresh install.
 */
export function ensureAdminSeed(db: DatabaseSync): void {
  const count = (db.prepare("SELECT COUNT(*) AS c FROM admins").get() as { c: number }).c;
  if (count > 0) return;

  const email = (process.env.ADMIN_EMAIL || "admin@swapspot.test").trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD || "admin12345";
  db.prepare(
    "INSERT INTO admins (id, email, password_hash, name, role, created_at) VALUES (?, ?, ?, ?, 'owner', ?)"
  ).run("admin-1", email, bcrypt.hashSync(password, 10), "Platform Owner", new Date().toISOString());
}
