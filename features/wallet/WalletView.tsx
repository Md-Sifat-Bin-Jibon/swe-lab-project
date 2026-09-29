"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/useToast";
import { fetchCurrentUser, fetchWallet } from "@/services/api";
import type { WalletTransaction } from "@/types";
import { AddFundsForm } from "./AddFundsForm";
import { formatMoney } from "./cardUtils";

const TX_META: Record<
  WalletTransaction["type"],
  { label: string; sign: "+" | "−"; badge: string; amountClass: string }
> = {
  deposit: { label: "Top-up", sign: "+", badge: "bg-emerald-50 text-emerald-600", amountClass: "text-emerald-600" },
  escrow_hold: { label: "Escrow held", sign: "−", badge: "bg-amber-50 text-amber-600", amountClass: "text-slate-900" },
  escrow_release: { label: "Escrow returned", sign: "+", badge: "bg-emerald-50 text-emerald-600", amountClass: "text-emerald-600" },
  escrow_refund: { label: "Escrow refunded", sign: "+", badge: "bg-emerald-50 text-emerald-600", amountClass: "text-emerald-600" },
};

function formatDateTime(value: string) {
  const d = new Date(value.includes("T") ? value : value.replace(" ", "T") + "Z");
  return Number.isNaN(d.getTime())
    ? value
    : d.toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

function Receipt({ tx, onDone }: { tx: WalletTransaction; onDone: () => void }) {
  return (
    <div className="mx-auto max-w-md py-4 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
        <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
          <path d="m5 12 5 5L20 7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <h2 className="mt-4 text-2xl font-bold text-slate-900">{formatMoney(tx.amount)} added</h2>
      <p className="mt-1 text-slate-500">Your funds are ready to use for swap deposits.</p>
      <dl className="mt-6 divide-y divide-slate-100 rounded-xl border border-slate-100 text-left text-sm">
        {[
          ["Paid with", `${tx.cardBrand} •••• ${tx.cardLast4}`],
          ["New balance", tx.balanceAfter !== null ? formatMoney(tx.balanceAfter) : "—"],
          ["Date", formatDateTime(tx.createdAt)],
          ["Reference", tx.id],
        ].map(([k, v]) => (
          <div key={k} className="flex justify-between gap-4 px-4 py-3">
            <dt className="text-slate-500">{k}</dt>
            <dd className="truncate font-medium text-slate-900">{v}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-6 flex justify-center gap-3">
        <button
          type="button"
          onClick={onDone}
          className="rounded-lg border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
        >
          Add more
        </button>
        <Link href="/profile" className="rounded-lg bg-swapspot-blue px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#3f52c4]">
          Back to profile
        </Link>
      </div>
    </div>
  );
}

export function WalletView() {
  const { showToast } = useToast();
  const [balance, setBalance] = useState<number | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [receipt, setReceipt] = useState<WalletTransaction | null>(null);

  function reload() {
    fetchWallet()
      .then((w) => {
        setBalance(w.balance);
        setTransactions(w.transactions);
      })
      .catch(() => showToast("Could not load your wallet."));
  }

  useEffect(reload, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <Link href="/profile" className="text-sm font-medium text-slate-500 hover:text-slate-800">
          ← Back to profile
        </Link>
        <h1 className="mt-3 text-2xl font-bold text-slate-900 sm:text-3xl">Wallet</h1>
        <p className="mt-1 text-slate-500">Add funds to cover deposits when you propose swaps.</p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-gradient-to-r from-[#4a5fd9] to-[#3f52c4] p-6 text-white shadow-sm">
        <div>
          <p className="text-sm text-white/70">Available balance</p>
          <p className="mt-1 text-4xl font-bold tabular-nums">
            {balance === null ? "—" : formatMoney(balance)}
          </p>
        </div>
        <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">Demo wallet</span>
      </div>

      <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm sm:p-8">
        {receipt ? (
          <Receipt tx={receipt} onDone={() => setReceipt(null)} />
        ) : (
          <>
            <h2 className="mb-6 text-lg font-bold text-slate-900">Add funds</h2>
            <AddFundsForm
              onSuccess={({ balance: next, transaction }) => {
                setBalance(next);
                setTransactions((t) => [transaction, ...t]);
                setReceipt(transaction);
                fetchCurrentUser().catch(() => {}); // refresh cached balance
                showToast(`${formatMoney(transaction.amount)} added to your wallet.`);
              }}
              onDeclined={reload}
            />
          </>
        )}
      </section>

      <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm sm:p-8">
        <h2 className="text-lg font-bold text-slate-900">Recent activity</h2>
        {transactions.length === 0 ? (
          <p className="mt-4 text-sm text-slate-400">No transactions yet.</p>
        ) : (
          <ul className="mt-4 divide-y divide-slate-100">
            {transactions.map((tx) => {
              const meta = TX_META[tx.type] ?? TX_META.deposit;
              const declined = tx.status !== "succeeded";
              return (
                <li key={tx.id} className="flex items-center justify-between gap-4 py-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold ${meta.badge}`} aria-hidden="true">
                      {meta.sign}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900">
                        {tx.type === "deposit" ? `Top-up · ${tx.cardBrand} •••• ${tx.cardLast4}` : meta.label}
                      </p>
                      <p className="truncate text-xs text-slate-500">
                        {formatDateTime(tx.createdAt)}
                        {tx.note ? ` · ${tx.note}` : ""}
                        {declined && tx.failureReason ? ` · ${tx.failureReason}` : ""}
                        {tx.swapId ? (
                          <>
                            {" · "}
                            <Link href={`/swaps/${encodeURIComponent(tx.swapId)}`} className="text-swapspot-blue hover:underline">
                              View swap
                            </Link>
                          </>
                        ) : null}
                      </p>
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className={`text-sm font-bold tabular-nums ${declined ? "text-slate-400 line-through" : meta.amountClass}`}>
                      {meta.sign}
                      {formatMoney(tx.amount)}
                    </p>
                    <p className={`text-xs ${declined ? "text-rose-500" : "text-slate-500"}`}>
                      {declined ? "Declined" : tx.balanceAfter !== null ? `Balance ${formatMoney(tx.balanceAfter)}` : "Completed"}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
