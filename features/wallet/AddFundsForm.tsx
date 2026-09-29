"use client";

import { useMemo, useState, type FormEvent } from "react";
import { depositFunds } from "@/services/api";
import type { WalletTransaction } from "@/types";
import {
  cardBrand,
  expiryError,
  formatCardNumber,
  formatExpiry,
  formatMoney,
  luhnValid,
  parseExpiry,
} from "./cardUtils";

const QUICK_AMOUNTS = [10, 25, 50, 100];

type Errors = Partial<Record<"amount" | "number" | "name" | "expiry" | "cvc", string>>;

function Field({
  id,
  label,
  error,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium text-slate-600">
        {label}
      </label>
      {children}
      {error ? <p className="text-xs text-rose-600">{error}</p> : null}
    </div>
  );
}

const inputClass = (error?: string) =>
  `w-full rounded-lg border bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-swapspot-blue/20 ${
    error ? "border-rose-300 focus:border-rose-400" : "border-slate-200 focus:border-swapspot-blue"
  }`;

function CardPreview({ number, name, expiry, brand }: { number: string; name: string; expiry: string; brand: string }) {
  const shown = (number || "•••• •••• •••• ••••").padEnd(19, "•");
  return (
    <div className="relative aspect-[1.586] w-full max-w-sm overflow-hidden rounded-2xl bg-gradient-to-br from-[#4a5fd9] via-[#3f52c4] to-[#1e2a78] p-6 text-white shadow-lg">
      <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10" aria-hidden="true" />
      <div className="absolute -bottom-16 -left-8 h-44 w-44 rounded-full bg-white/5" aria-hidden="true" />
      <div className="relative flex h-full flex-col justify-between">
        <div className="flex items-start justify-between">
          <div className="h-8 w-11 rounded-md bg-gradient-to-br from-amber-200 to-amber-400" aria-hidden="true" />
          <span className="text-lg font-bold italic tracking-wide">{brand || "CARD"}</span>
        </div>
        <p className="font-mono text-xl tracking-[0.12em] sm:text-2xl">{shown}</p>
        <div className="flex items-end justify-between text-xs uppercase">
          <div className="min-w-0">
            <p className="text-white/60">Card holder</p>
            <p className="truncate text-sm font-semibold tracking-wide">{name || "YOUR NAME"}</p>
          </div>
          <div className="text-right">
            <p className="text-white/60">Expires</p>
            <p className="text-sm font-semibold">{expiry || "MM / YY"}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function AddFundsForm({
  onSuccess,
  onDeclined,
}: {
  onSuccess: (result: { balance: number; transaction: WalletTransaction }) => void;
  onDeclined?: () => void;
}) {
  const [amount, setAmount] = useState("25");
  const [number, setNumber] = useState("");
  const [name, setName] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  const digits = number.replace(/\D/g, "");
  const brand = cardBrand(digits);
  const cvcLength = brand === "Amex" ? 4 : 3;
  const amountValue = Number(amount);

  const fee = 0;
  const total = useMemo(() => (Number.isFinite(amountValue) ? amountValue + fee : 0), [amountValue]);

  function clearError(key: keyof Errors) {
    setErrors((e) => (e[key] ? { ...e, [key]: undefined } : e));
    setServerError(null);
  }

  function validate(): Errors {
    const e: Errors = {};
    if (!Number.isFinite(amountValue) || amountValue < 1) e.amount = "Minimum top-up is $1.";
    else if (amountValue > 10000) e.amount = "Maximum top-up is $10,000.";
    else if (!/^\d+(\.\d{1,2})?$/.test(amount)) e.amount = "Use at most 2 decimal places.";
    if (!luhnValid(digits)) e.number = "Your card number is invalid.";
    if (!name.trim()) e.name = "Enter the name on the card.";
    const exp = expiryError(expiry);
    if (exp) e.expiry = exp;
    if (cvc.length !== cvcLength) e.cvc = `Enter the ${cvcLength}-digit code.`;
    return e;
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setServerError(null);
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) return;

    const exp = parseExpiry(expiry)!;
    setProcessing(true);
    try {
      const result = await depositFunds({
        cardNumber: digits,
        cardName: name.trim(),
        expMonth: exp.month,
        expYear: exp.year,
        cvc,
        amount: amountValue,
      });
      // Clear sensitive fields right away.
      setNumber("");
      setCvc("");
      setExpiry("");
      onSuccess(result);
    } catch (error) {
      setServerError(error instanceof Error ? error.message : "Payment failed.");
      setCvc("");
      onDeclined?.();
    } finally {
      setProcessing(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="grid gap-8 lg:grid-cols-[1fr_minmax(0,380px)]">
      <div className="space-y-5">
        <Field id="amount" label="Amount (USD)" error={errors.amount}>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">$</span>
            <input
              id="amount"
              inputMode="decimal"
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value.replace(/[^\d.]/g, ""));
                clearError("amount");
              }}
              className={`${inputClass(errors.amount)} pl-8 text-lg font-semibold`}
              disabled={processing}
            />
          </div>
          <div className="flex flex-wrap gap-2 pt-1">
            {QUICK_AMOUNTS.map((q) => (
              <button
                key={q}
                type="button"
                disabled={processing}
                onClick={() => {
                  setAmount(String(q));
                  clearError("amount");
                }}
                className={`rounded-lg border px-4 py-1.5 text-sm font-semibold transition ${
                  Number(amount) === q
                    ? "border-swapspot-blue bg-swapspot-blue/10 text-swapspot-blue"
                    : "border-slate-200 text-slate-600 hover:border-slate-300"
                }`}
              >
                ${q}
              </button>
            ))}
          </div>
        </Field>

        <Field id="card-number" label="Card number" error={errors.number}>
          <div className="relative">
            <input
              id="card-number"
              inputMode="numeric"
              autoComplete="cc-number"
              placeholder="1234 1234 1234 1234"
              value={number}
              onChange={(e) => {
                setNumber(formatCardNumber(e.target.value));
                clearError("number");
              }}
              className={`${inputClass(errors.number)} pr-24 font-mono tracking-wider`}
              disabled={processing}
            />
            {brand ? (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 rounded bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-600">
                {brand}
              </span>
            ) : null}
          </div>
        </Field>

        <Field id="card-name" label="Name on card" error={errors.name}>
          <input
            id="card-name"
            autoComplete="cc-name"
            placeholder="Full name"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              clearError("name");
            }}
            className={inputClass(errors.name)}
            disabled={processing}
          />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field id="card-expiry" label="Expiry" error={errors.expiry}>
            <input
              id="card-expiry"
              inputMode="numeric"
              autoComplete="cc-exp"
              placeholder="MM / YY"
              value={expiry}
              onChange={(e) => {
                setExpiry(formatExpiry(e.target.value));
                clearError("expiry");
              }}
              className={inputClass(errors.expiry)}
              disabled={processing}
            />
          </Field>
          <Field id="card-cvc" label="CVC" error={errors.cvc}>
            <input
              id="card-cvc"
              inputMode="numeric"
              autoComplete="cc-csc"
              placeholder={cvcLength === 4 ? "1234" : "123"}
              value={cvc}
              onChange={(e) => {
                setCvc(e.target.value.replace(/\D/g, "").slice(0, cvcLength));
                clearError("cvc");
              }}
              className={inputClass(errors.cvc)}
              disabled={processing}
            />
          </Field>
        </div>

        {serverError ? (
          <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700" role="alert">
            {serverError}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={processing}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-swapspot-blue px-6 py-3.5 text-base font-semibold text-white transition hover:bg-[#3f52c4] disabled:opacity-80"
        >
          {processing ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden="true" />
              Processing payment…
            </>
          ) : (
            `Add ${Number.isFinite(total) && total > 0 ? formatMoney(total) : "funds"}`
          )}
        </button>
        <p className="flex items-center justify-center gap-1.5 text-xs text-slate-400">
          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <rect x="5" y="11" width="14" height="10" rx="2" />
            <path d="M8 11V7a4 4 0 0 1 8 0v4" />
          </svg>
          We only keep the card brand and last 4 digits.
        </p>
      </div>

      <div className="space-y-5">
        <CardPreview number={number} name={name.toUpperCase()} expiry={expiry} brand={brand} />
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <p className="font-semibold">Demo mode — no real charge</p>
          <p className="mt-1">Payments are simulated. Use a test card:</p>
          <ul className="mt-2 space-y-1 font-mono text-xs">
            <li>
              <button type="button" className="hover:underline" onClick={() => {
                  setNumber("4242 4242 4242 4242");
                  clearError("number");
                }}>
                4242 4242 4242 4242
              </button>{" "}
              <span className="font-sans">— succeeds</span>
            </li>
            <li>
              <button type="button" className="hover:underline" onClick={() => {
                  setNumber("4000 0000 0000 0002");
                  clearError("number");
                }}>
                4000 0000 0000 0002
              </button>{" "}
              <span className="font-sans">— declined</span>
            </li>
          </ul>
          <p className="mt-2 text-xs">Any future expiry and any 3-digit CVC.</p>
        </div>
      </div>
    </form>
  );
}
