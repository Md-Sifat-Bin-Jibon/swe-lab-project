import { randomBytes } from "node:crypto";
import type { DatabaseSync } from "node:sqlite";
import { logActivity } from "@/lib/activity";
import type { WalletTransaction } from "@/types";

/*
 * DEMO payment processing — no real gateway is called and no money moves.
 * Only the card brand + last 4 digits are ever stored; the full number,
 * expiry and CVC are validated in memory and then discarded.
 *
 * Test cards:
 *   4242 4242 4242 4242  → succeeds
 *   4000 0000 0000 0002  → declined
 *   4000 0000 0000 9995  → declined (insufficient funds)
 */

export const MIN_DEPOSIT = 1;
export const MAX_DEPOSIT = 10_000;

export function luhnValid(digits: string): boolean {
  let sum = 0;
  let double = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let d = Number(digits[i]);
    if (double) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    double = !double;
  }
  return sum % 10 === 0;
}

export function cardBrand(digits: string): string {
  if (/^4/.test(digits)) return "Visa";
  if (/^(5[1-5]|2(2[2-9]|[3-6]\d|7[01]|720))/.test(digits)) return "Mastercard";
  if (/^3[47]/.test(digits)) return "Amex";
  if (/^6(011|5)/.test(digits)) return "Discover";
  return "Card";
}

export type DepositInput = {
  cardNumber: string;
  cardName: string;
  expMonth: number;
  expYear: number;
  cvc: string;
  amount: number;
};

export function validateDeposit(input: DepositInput): string | null {
  const digits = input.cardNumber.replace(/\D/g, "");
  if (!input.cardName.trim()) return "Enter the name on the card.";
  if (digits.length < 13 || digits.length > 19 || !luhnValid(digits)) {
    return "Your card number is invalid.";
  }
  const brand = cardBrand(digits);
  const cvcLen = brand === "Amex" ? 4 : 3;
  if (!new RegExp(`^\\d{${cvcLen}}$`).test(input.cvc)) {
    return `The security code must be ${cvcLen} digits.`;
  }
  const m = Number(input.expMonth);
  let y = Number(input.expYear);
  if (y < 100) y += 2000;
  if (!Number.isInteger(m) || m < 1 || m > 12 || !Number.isInteger(y)) {
    return "Your card's expiry date is invalid.";
  }
  const now = new Date();
  if (y < now.getFullYear() || (y === now.getFullYear() && m < now.getMonth() + 1)) {
    return "Your card has expired.";
  }
  if (y > now.getFullYear() + 20) return "Your card's expiry date is invalid.";

  if (!Number.isFinite(input.amount) || input.amount < MIN_DEPOSIT || input.amount > MAX_DEPOSIT) {
    return `Amount must be between $${MIN_DEPOSIT} and $${MAX_DEPOSIT.toLocaleString()}.`;
  }
  if (Math.round(input.amount * 100) !== input.amount * 100) {
    return "Amount can have at most 2 decimal places.";
  }
  return null;
}

function simulatedDecline(digits: string): string | null {
  if (digits === "4000000000000002") return "Your card was declined.";
  if (digits === "4000000000009995") return "Your card has insufficient funds.";
  return null;
}

function toTransaction(row: Record<string, unknown>): WalletTransaction {
  return {
    id: String(row.id),
    type: (row.type as WalletTransaction["type"]) ?? "deposit",
    swapId: (row.swap_id as string) ?? null,
    note: (row.note as string) ?? null,
    amount: Number(row.amount),
    status: row.status as WalletTransaction["status"],
    cardBrand: (row.card_brand as string) ?? null,
    cardLast4: (row.card_last4 as string) ?? null,
    failureReason: (row.failure_reason as string) ?? null,
    balanceAfter: row.balance_after === null ? null : Number(row.balance_after),
    createdAt: String(row.created_at),
  };
}

export function processDeposit(
  db: DatabaseSync,
  userId: string,
  input: DepositInput
): { ok: true; balance: number; transaction: WalletTransaction } | { ok: false; error: string; transaction?: WalletTransaction } {
  const invalid = validateDeposit(input);
  if (invalid) return { ok: false, error: invalid };

  const digits = input.cardNumber.replace(/\D/g, "");
  const brand = cardBrand(digits);
  const last4 = digits.slice(-4);
  const amount = Math.round(input.amount * 100) / 100;
  const id = `txn_${randomBytes(9).toString("hex")}`;
  const now = new Date().toISOString();

  const decline = simulatedDecline(digits);
  if (decline) {
    db.prepare(
      `INSERT INTO wallet_transactions (id, user_id, type, amount, status, card_brand, card_last4, failure_reason, created_at)
       VALUES (?, ?, 'deposit', ?, 'declined', ?, ?, ?, ?)`
    ).run(id, userId, amount, brand, last4, decline, now);
    const row = db.prepare("SELECT * FROM wallet_transactions WHERE id = ?").get(id) as Record<string, unknown>;
    return { ok: false, error: decline, transaction: toTransaction(row) };
  }

  db.exec("BEGIN");
  try {
    db.prepare("UPDATE users SET balance = ROUND(balance + ?, 2) WHERE id = ?").run(amount, userId);
    const { balance } = db.prepare("SELECT balance FROM users WHERE id = ?").get(userId) as { balance: number };
    db.prepare(
      `INSERT INTO wallet_transactions (id, user_id, type, amount, status, card_brand, card_last4, balance_after, created_at)
       VALUES (?, ?, 'deposit', ?, 'succeeded', ?, ?, ?, ?)`
    ).run(id, userId, amount, brand, last4, balance, now);
    db.exec("COMMIT");
    logActivity(db, { actorId: userId, kind: "topup", data: { amount, card: `${brand} •••• ${last4}` } });
    const row = db.prepare("SELECT * FROM wallet_transactions WHERE id = ?").get(id) as Record<string, unknown>;
    return { ok: true, balance: Number(balance), transaction: toTransaction(row) };
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}

export function getWallet(db: DatabaseSync, userId: string) {
  const user = db.prepare("SELECT balance FROM users WHERE id = ?").get(userId) as { balance: number } | undefined;
  if (!user) return null;
  const rows = db
    .prepare("SELECT * FROM wallet_transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT 20")
    .all(userId) as Record<string, unknown>[];
  return { balance: Number(user.balance ?? 0), transactions: rows.map(toTransaction) };
}
