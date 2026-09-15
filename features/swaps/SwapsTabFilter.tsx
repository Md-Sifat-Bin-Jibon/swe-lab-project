"use client";

export type SwapsTab = "current" | "pending" | "history";

export interface SwapsTabFilterProps {
  active: SwapsTab;
  onChange: (tab: SwapsTab) => void;
}

function tabClass(isActive: boolean): string {
  return isActive
    ? "rounded-lg bg-white px-5 py-2 text-sm font-semibold text-slate-900 shadow-sm transition"
    : "rounded-lg px-5 py-2 text-sm font-semibold text-slate-500 transition hover:text-slate-700";
}

export function SwapsTabFilter({ active, onChange }: SwapsTabFilterProps) {
  return (
    <div
      className="inline-flex rounded-xl bg-slate-100 p-1"
      role="tablist"
      aria-label="Swap filters"
    >
      {(
        [
          ["current", "Current"],
          ["pending", "Pending"],
          ["history", "History"],
        ] as const
      ).map(([key, label]) => (
        <button
          key={key}
          type="button"
          role="tab"
          aria-selected={active === key}
          className={tabClass(active === key)}
          onClick={() => onChange(key)}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
