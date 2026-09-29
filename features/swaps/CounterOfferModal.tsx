"use client";

import { useEffect, useId, useState } from "react";
import type { ProposalSwap } from "@/types";

export type CounterTarget = Pick<
  ProposalSwap,
  "id" | "partnerName" | "youGive" | "youGet" | "deadline" | "deposit" | "depositHeld" | "viewerRole"
> & { theirSkills?: string[]; mySkills?: string[]; myBalance?: number | null };

const money = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD" });

function todayIso(): string {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
}

/** Only pre-fill the date input with an ISO date the input can accept. */
function asDateInput(value: string | null | undefined): string {
  if (!value) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
}

function Changed({ show }: { show: boolean }) {
  return show ? (
    <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-amber-700">
      Changed
    </span>
  ) : null;
}

export function CounterOfferModal({
  target,
  busy,
  error,
  onClose,
  onSubmit,
}: {
  target: CounterTarget;
  busy: boolean;
  error: string | null;
  onClose: () => void;
  onSubmit: (input: {
    youGive: string;
    youGet: string;
    deadline: string | null;
    deposit: number;
    message: string | null;
  }) => void;
}) {
  const giveListId = useId();
  const getListId = useId();
  const [youGive, setYouGive] = useState(target.youGive ?? "");
  const [youGet, setYouGet] = useState(target.youGet ?? "");
  const [deadline, setDeadline] = useState(asDateInput(target.deadline));
  const [message, setMessage] = useState("");
  const [deposit, setDeposit] = useState(String(target.deposit ?? 0));
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && !busy && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [busy, onClose]);

  const same = (a: string, b: string | null | undefined) => a.trim().toLowerCase() === (b ?? "").trim().toLowerCase();
  const giveChanged = !same(youGive, target.youGive);
  const getChanged = !same(youGet, target.youGet);
  const dateChanged = deadline !== asDateInput(target.deadline);
  const depositValue = deposit.trim() === "" ? NaN : Number(deposit);
  const depositChanged = Number.isFinite(depositValue) && depositValue !== Number(target.deposit ?? 0);
  const anyChange = giveChanged || getChanged || dateChanged || depositChanged;

  // The proposer funds the escrow; only their own counter moves money now.
  const iFundEscrow = target.viewerRole === "proposer";
  const held = Number(target.depositHeld ?? target.deposit ?? 0);
  const delta = Number.isFinite(depositValue) ? Math.round((depositValue - held) * 100) / 100 : 0;

  function submit() {
    if (!youGive.trim() || !youGet.trim()) {
      setLocalError("Enter both the skill you'll teach and the skill you want.");
      return;
    }
    if (!Number.isFinite(depositValue) || depositValue < 0 || depositValue > 10000) {
      setLocalError("Escrow deposit must be between $0 and $10,000.");
      return;
    }
    if (!/^\d+(\.\d{1,2})?$/.test(deposit.trim())) {
      setLocalError("Escrow deposit can have at most 2 decimal places.");
      return;
    }
    if (iFundEscrow && delta > 0 && target.myBalance != null && delta > target.myBalance) {
      setLocalError(`Raising the deposit needs ${money(delta)} more, but your balance is ${money(target.myBalance)}.`);
      return;
    }
    if (!anyChange) {
      setLocalError("Change at least one term — or accept the proposal as it is.");
      return;
    }
    setLocalError(null);
    onSubmit({
      youGive: youGive.trim(),
      youGet: youGet.trim(),
      deadline: deadline || null,
      deposit: depositValue,
      message: message.trim() || null,
    });
  }

  const shownError = localError || error;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget && !busy) onClose();
      }}
    >
      <div
        className="max-h-[92vh] w-full max-w-lg overflow-auto rounded-2xl bg-white p-6 shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="counter-modal-title"
      >
        <h2 id="counter-modal-title" className="text-xl font-bold text-slate-900">
          Counter-offer to {target.partnerName || "your partner"}
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Suggest different terms. {target.partnerName || "They"} can then accept, decline or counter back.
        </p>

        <div className="mt-4 rounded-xl bg-slate-50 p-4 text-sm">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Current terms</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-slate-500">You teach</p>
              <p className="font-semibold text-slate-900">{target.youGive || "—"}</p>
            </div>
            <div>
              <p className="text-slate-500">You learn</p>
              <p className="font-semibold text-slate-900">{target.youGet || "—"}</p>
            </div>
          </div>
        </div>

        <div className="mt-5 space-y-4">
          <div>
            <label htmlFor="counter-give" className="mb-1.5 block text-sm font-medium text-slate-600">
              You&apos;ll teach
              <Changed show={giveChanged} />
            </label>
            <input
              id="counter-give"
              list={giveListId}
              value={youGive}
              maxLength={60}
              onChange={(e) => setYouGive(e.target.value)}
              disabled={busy}
              placeholder="e.g. Web Development"
              className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-slate-900 focus:border-swapspot-blue focus:outline-none focus:ring-2 focus:ring-swapspot-blue/20"
            />
            <datalist id={giveListId}>
              {(target.mySkills ?? []).map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>
          </div>

          <div>
            <label htmlFor="counter-get" className="mb-1.5 block text-sm font-medium text-slate-600">
              You&apos;ll learn from {target.partnerName || "them"}
              <Changed show={getChanged} />
            </label>
            <input
              id="counter-get"
              list={getListId}
              value={youGet}
              maxLength={60}
              onChange={(e) => setYouGet(e.target.value)}
              disabled={busy}
              placeholder="e.g. Photography"
              className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-slate-900 focus:border-swapspot-blue focus:outline-none focus:ring-2 focus:ring-swapspot-blue/20"
            />
            <datalist id={getListId}>
              {(target.theirSkills ?? []).map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>
            {target.theirSkills?.length ? (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {target.theirSkills.slice(0, 6).map((s) => (
                  <button
                    key={s}
                    type="button"
                    disabled={busy}
                    onClick={() => setYouGet(s)}
                    className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${
                      same(youGet, s)
                        ? "bg-swapspot-blue text-white"
                        : "bg-swapspot-blue/10 text-swapspot-blue hover:bg-swapspot-blue/20"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <div>
            <label htmlFor="counter-deadline" className="mb-1.5 block text-sm font-medium text-slate-600">
              Swap end date <span className="font-normal text-slate-400">(optional)</span>
              <Changed show={dateChanged} />
            </label>
            <input
              id="counter-deadline"
              type="date"
              min={todayIso()}
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              disabled={busy}
              className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-slate-900 focus:border-swapspot-blue focus:outline-none focus:ring-2 focus:ring-swapspot-blue/20"
            />
          </div>

          <div>
            <label htmlFor="counter-deposit" className="mb-1.5 block text-sm font-medium text-slate-600">
              Escrow deposit
              <Changed show={depositChanged} />
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">$</span>
              <input
                id="counter-deposit"
                inputMode="decimal"
                value={deposit}
                onChange={(e) => setDeposit(e.target.value.replace(/[^\d.]/g, ""))}
                disabled={busy}
                className="w-full rounded-lg border border-slate-200 py-2.5 pl-8 pr-4 text-slate-900 focus:border-swapspot-blue focus:outline-none focus:ring-2 focus:ring-swapspot-blue/20"
              />
            </div>
            <p className="mt-1.5 text-xs leading-relaxed text-slate-500">
              {iFundEscrow ? (
                delta > 0 ? (
                  <>
                    <span className="font-semibold text-slate-700">{money(delta)}</span> more will be held from your
                    balance now{target.myBalance != null ? ` (available ${money(target.myBalance)})` : ""}.
                  </>
                ) : delta < 0 ? (
                  <>
                    <span className="font-semibold text-emerald-700">{money(-delta)}</span> will be returned to your
                    balance now.
                  </>
                ) : (
                  <>You fund this deposit. {money(held)} is currently held from your balance.</>
                )
              ) : (
                <>
                  {target.partnerName || "They"} fund{target.partnerName ? "s" : ""} this deposit ({money(held)} held now).
                  A new amount is only charged to them if they accept it.
                </>
              )}
            </p>
          </div>

          <div>
            <label htmlFor="counter-message" className="mb-1.5 block text-sm font-medium text-slate-600">
              Note <span className="font-normal text-slate-400">(optional)</span>
            </label>
            <textarea
              id="counter-message"
              rows={3}
              maxLength={500}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={busy}
              placeholder="Explain why you're suggesting these changes…"
              className="w-full resize-none rounded-lg border border-slate-200 px-4 py-2.5 text-sm text-slate-900 focus:border-swapspot-blue focus:outline-none focus:ring-2 focus:ring-swapspot-blue/20"
            />
            <p className="mt-1 text-right text-xs text-slate-400">{message.length}/500</p>
          </div>

        </div>

        {shownError ? (
          <p className="mt-4 rounded-lg bg-rose-50 px-4 py-2.5 text-sm text-rose-700" role="alert">
            {shownError}
          </p>
        ) : null}

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={busy}
            className="rounded-lg bg-swapspot-blue px-5 py-2 text-sm font-semibold text-white hover:bg-[#3f52c4] disabled:opacity-70"
          >
            {busy ? "Sending…" : "Send counter-offer"}
          </button>
        </div>
      </div>
    </div>
  );
}
