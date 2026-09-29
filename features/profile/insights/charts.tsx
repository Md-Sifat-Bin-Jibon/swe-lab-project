"use client";

import { useState, type ReactNode } from "react";
import type { DataSource } from "@/types";

/**
 * Categorical slots (fixed order, validated for CVD separation on white).
 * Slots 3–4 are < 3:1 contrast, so every chart using them also shows a
 * legend with values (never color alone).
 */
export const SERIES = ["#4a5fd9", "#eb6834", "#1baf7a", "#eda100"] as const;

const GRID = "#eef0f4";

function niceMax(value: number): number {
  if (value <= 4) return 4;
  const pow = Math.pow(10, Math.floor(Math.log10(value)));
  const n = value / pow;
  const step = n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10;
  return step * pow;
}

export function SourceBadge({ source }: { source: DataSource }) {
  if (source === "live") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
        Your data
      </span>
    );
  }
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500"
      title="Example data — this chart fills in with your own activity as you use SwapSpot."
    >
      <span className="h-1.5 w-1.5 rounded-full bg-slate-400" aria-hidden="true" />
      Sample data
    </span>
  );
}

export function ChartCard({
  title,
  subtitle,
  source,
  children,
  className = "",
}: {
  title: string;
  subtitle?: string;
  source?: DataSource;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-2xl border border-slate-100 bg-white p-6 shadow-sm ${className}`.trim()}
    >
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-slate-900">{title}</h3>
          {subtitle ? <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p> : null}
        </div>
        {source ? <SourceBadge source={source} /> : null}
      </div>
      {children}
    </section>
  );
}

export function Legend({ items }: { items: { label: string; color: string; value?: ReactNode }[] }) {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-slate-600">
      {items.map((item) => (
        <li key={item.label} className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: item.color }} aria-hidden="true" />
          {item.label}
          {item.value !== undefined ? (
            <span className="font-semibold text-slate-900">{item.value}</span>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

/** Vertical columns; one or more series grouped per category, with hover tooltip. */
export function ColumnChart({
  categories,
  series,
  height = 180,
  ariaLabel,
}: {
  categories: string[];
  series: { name: string; color: string; values: number[] }[];
  height?: number;
  ariaLabel: string;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const max = niceMax(Math.max(1, ...series.flatMap((s) => s.values)));
  const ticks = [0, max / 2, max];

  return (
    <div>
      {series.length > 1 ? (
        <div className="mb-4">
          <Legend items={series.map((s) => ({ label: s.name, color: s.color }))} />
        </div>
      ) : null}
      <div className="flex gap-3">
        {/* y-axis */}
        <div className="relative w-6 shrink-0 text-right text-[11px] text-slate-400" style={{ height }}>
          {ticks.map((t) => (
            <span
              key={t}
              className="absolute right-0 -translate-y-1/2 tabular-nums"
              style={{ top: `${100 - (t / max) * 100}%` }}
            >
              {Number.isInteger(t) ? t : t.toFixed(1)}
            </span>
          ))}
        </div>

        <div className="relative flex-1" style={{ height }} role="img" aria-label={ariaLabel}>
          {ticks.map((t) => (
            <div
              key={t}
              className="absolute inset-x-0 h-px"
              style={{ top: `${100 - (t / max) * 100}%`, backgroundColor: GRID }}
              aria-hidden="true"
            />
          ))}

          <div className="absolute inset-0 flex">
            {categories.map((cat, ci) => (
              <div
                key={cat + ci}
                className={`relative flex flex-1 items-end justify-center gap-0.5 rounded-md transition-colors ${hover === ci ? "bg-slate-50" : ""}`}
                onMouseEnter={() => setHover(ci)}
                onMouseLeave={() => setHover(null)}
                onFocus={() => setHover(ci)}
                onBlur={() => setHover(null)}
                tabIndex={0}
              >
                {series.map((s) => (
                  <div
                    key={s.name}
                    className="w-full max-w-[24px] rounded-t"
                    style={{
                      height: `${(s.values[ci] / max) * 100}%`,
                      minHeight: s.values[ci] > 0 ? 3 : 0,
                      backgroundColor: s.color,
                    }}
                  />
                ))}

                {hover === ci ? (
                  <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-slate-900 px-3 py-2 text-xs text-white shadow-lg">
                    <p className="mb-1 font-semibold">{cat}</p>
                    {series.map((s) => (
                      <p key={s.name} className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-sm" style={{ backgroundColor: s.color }} />
                        {s.name}: <span className="font-semibold">{s.values[ci]}</span>
                      </p>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-2 flex gap-3 pl-9">
        {categories.map((cat, ci) => (
          <span key={cat + ci} className="flex-1 text-center text-xs text-slate-400">
            {cat}
          </span>
        ))}
      </div>

      <table className="sr-only">
        <caption>{ariaLabel}</caption>
        <thead>
          <tr>
            <th>Month</th>
            {series.map((s) => (
              <th key={s.name}>{s.name}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {categories.map((cat, ci) => (
            <tr key={cat + ci}>
              <td>{cat}</td>
              {series.map((s) => (
                <td key={s.name}>{s.values[ci]}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Horizontal bars for a single series, value at the tip. */
export function BarList({
  items,
  color = SERIES[0],
  formatValue = (v) => String(v),
  emptyLabel = "No data yet",
}: {
  items: { label: string; value: number }[];
  color?: string;
  formatValue?: (v: number) => string;
  emptyLabel?: string;
}) {
  const max = Math.max(1, ...items.map((i) => i.value));
  if (!items.length) return <p className="text-sm text-slate-400">{emptyLabel}</p>;

  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item.label} title={`${item.label}: ${formatValue(item.value)}`}>
          <div className="mb-1.5 flex items-baseline justify-between gap-3 text-sm">
            <span className="truncate text-slate-600">{item.label}</span>
            <span className="shrink-0 font-semibold tabular-nums text-slate-900">
              {formatValue(item.value)}
            </span>
          </div>
          <div className="h-2.5 w-full rounded-r bg-slate-100">
            <div
              className="h-full rounded-r"
              style={{
                width: `${(item.value / max) * 100}%`,
                minWidth: item.value > 0 ? 4 : 0,
                backgroundColor: color,
              }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

/** Part-to-whole bar with 2px surface gaps between segments. */
export function StackedBar({
  segments,
}: {
  segments: { label: string; value: number; color: string }[];
}) {
  const [hover, setHover] = useState<string | null>(null);
  const total = segments.reduce((a, s) => a + s.value, 0);
  const visible = segments.filter((s) => s.value > 0);

  return (
    <div>
      <div className="mb-1 flex items-baseline gap-2">
        <span className="text-3xl font-bold tabular-nums text-slate-900">{total}</span>
        <span className="text-sm text-slate-500">swaps in total</span>
      </div>
      <div className="relative mt-3 flex h-4 w-full gap-[2px] overflow-visible" role="img" aria-label="Swaps by status">
        {visible.map((s, i) => (
          <div
            key={s.label}
            className={`relative h-full transition-opacity ${hover && hover !== s.label ? "opacity-40" : ""} ${i === 0 ? "rounded-l" : ""} ${i === visible.length - 1 ? "rounded-r" : ""}`}
            style={{ width: `${(s.value / Math.max(1, total)) * 100}%`, backgroundColor: s.color }}
            onMouseEnter={() => setHover(s.label)}
            onMouseLeave={() => setHover(null)}
          >
            {hover === s.label ? (
              <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-slate-900 px-3 py-1.5 text-xs text-white">
                {s.label}: <span className="font-semibold">{s.value}</span> ({Math.round((s.value / total) * 100)}%)
              </div>
            ) : null}
          </div>
        ))}
      </div>
      <div className="mt-5">
        <Legend items={segments.map((s) => ({ label: s.label, color: s.color, value: s.value }))} />
      </div>
    </div>
  );
}

/** Circular progress ring for a single percentage. */
export function RingMeter({ percent, size = 112 }: { percent: number; size?: number }) {
  const stroke = 10;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const color = percent >= 75 ? SERIES[0] : percent >= 40 ? "#eda100" : "#e34948";
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e8ebfb" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - percent / 100)}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold tabular-nums text-slate-900">{percent}%</span>
        <span className="text-[11px] text-slate-500">complete</span>
      </div>
    </div>
  );
}
