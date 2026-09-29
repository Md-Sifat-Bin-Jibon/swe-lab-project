"use client";

import type { ReactNode } from "react";

export const money = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD" });

export function dateTime(value: string | null | undefined): string {
  if (!value) return "—";
  const d = new Date(value.includes("T") ? value : `${value.replace(" ", "T")}Z`);
  return Number.isNaN(d.getTime())
    ? value
    : d.toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
}

export function dateOnly(value: string | null | undefined): string {
  if (!value) return "—";
  const d = new Date(value.includes("T") ? value : `${value.replace(" ", "T")}Z`);
  return Number.isNaN(d.getTime()) ? value : d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
        {subtitle ? <p className="mt-1 text-sm text-slate-500">{subtitle}</p> : null}
      </div>
      {actions}
    </div>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-2xl border border-slate-200 bg-white shadow-sm ${className}`}>{children}</div>;
}

export function StatTile({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: string | number;
  hint?: string;
  tone?: "default" | "warning" | "danger" | "good";
}) {
  const tones = {
    default: "text-slate-900",
    warning: "text-amber-600",
    danger: "text-rose-600",
    good: "text-emerald-600",
  } as const;
  return (
    <Card className="p-4">
      <p className="text-sm text-slate-500">{label}</p>
      <p className={`mt-1.5 text-2xl font-bold tabular-nums ${tones[tone]}`}>{value}</p>
      {hint ? <p className="mt-0.5 text-xs text-slate-400">{hint}</p> : null}
    </Card>
  );
}

const BADGE_TONES = {
  neutral: "bg-slate-100 text-slate-600",
  blue: "bg-swapspot-blue/10 text-swapspot-blue",
  green: "bg-emerald-50 text-emerald-700",
  amber: "bg-amber-50 text-amber-700",
  red: "bg-rose-50 text-rose-700",
  violet: "bg-violet-50 text-violet-700",
} as const;

export function Badge({ children, tone = "neutral" }: { children: ReactNode; tone?: keyof typeof BADGE_TONES }) {
  return <span className={`inline-block rounded-md px-2 py-0.5 text-xs font-semibold ${BADGE_TONES[tone]}`}>{children}</span>;
}

export function Toolbar({ children }: { children: ReactNode }) {
  return <div className="mb-4 flex flex-wrap items-center gap-2">{children}</div>;
}

export function SearchInput({
  value,
  onChange,
  placeholder = "Search…",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <input
      type="search"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      aria-label={placeholder}
      className="w-full max-w-xs rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm focus:border-swapspot-blue focus:outline-none focus:ring-2 focus:ring-swapspot-blue/20"
    />
  );
}

export function Select({
  value,
  onChange,
  options,
  label,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  label: string;
}) {
  return (
    <select
      aria-label={label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-swapspot-blue focus:outline-none"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

export function Table({
  head,
  children,
  minWidth = 700,
}: {
  head: string[];
  children: ReactNode;
  /** Narrower for tables nested inside cards. */
  minWidth?: number;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm" style={{ minWidth }}>
        <thead>
          <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
            {head.map((h) => (
              <th key={h} className="px-4 py-3 font-semibold">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">{children}</tbody>
      </table>
    </div>
  );
}

export function Pagination({
  page,
  pageSize,
  total,
  onPage,
}: {
  page: number;
  pageSize: number;
  total: number;
  onPage: (p: number) => void;
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  return (
    <div className="flex items-center justify-between gap-3 border-t border-slate-100 px-4 py-3 text-sm text-slate-500">
      <span>
        {from}–{to} of {total}
      </span>
      <div className="flex gap-2">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPage(page - 1)}
          className="rounded-lg border border-slate-200 px-3 py-1.5 font-semibold text-slate-600 disabled:opacity-40"
        >
          Previous
        </button>
        <span className="px-1 py-1.5">
          {page} / {pages}
        </span>
        <button
          type="button"
          disabled={page >= pages}
          onClick={() => onPage(page + 1)}
          className="rounded-lg border border-slate-200 px-3 py-1.5 font-semibold text-slate-600 disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </div>
  );
}

export function EmptyRow({ colSpan, children }: { colSpan: number; children: ReactNode }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-4 py-10 text-center text-slate-400">
        {children}
      </td>
    </tr>
  );
}

export function LoadingRows({ colSpan, rows = 5 }: { colSpan: number; rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <tr key={i}>
          <td colSpan={colSpan} className="px-4 py-3">
            <div className="h-6 animate-pulse rounded bg-slate-100" />
          </td>
        </tr>
      ))}
    </>
  );
}

export function Modal({ title, children, onClose, wide }: { title: string; children: ReactNode; onClose: () => void; wide?: boolean }) {
  return (
    <div className="fixed inset-0 z-[70] flex items-start justify-center overflow-y-auto bg-slate-900/50 p-4 py-10" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div role="dialog" aria-modal="true" className={`w-full ${wide ? "max-w-4xl" : "max-w-xl"} rounded-2xl bg-white shadow-2xl`}>
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 className="text-lg font-bold text-slate-900">{title}</h2>
          <button type="button" onClick={onClose} className="rounded-lg px-2 text-xl text-slate-400 hover:text-slate-700" aria-label="Close">
            ×
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

export function ActionButton({
  children,
  onClick,
  tone = "default",
  disabled,
  type = "button",
}: {
  children: ReactNode;
  onClick?: () => void;
  tone?: "default" | "primary" | "danger";
  disabled?: boolean;
  type?: "button" | "submit";
}) {
  const tones = {
    default: "border border-slate-200 text-slate-700 hover:bg-slate-50",
    primary: "bg-swapspot-blue text-white hover:bg-[#3f52c4]",
    danger: "bg-rose-500 text-white hover:bg-rose-600",
  } as const;
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={`rounded-lg px-3.5 py-2 text-sm font-semibold transition disabled:opacity-60 ${tones[tone]}`}>
      {children}
    </button>
  );
}
