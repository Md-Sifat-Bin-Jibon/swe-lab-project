"use client";

import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from "react";

const chevron = (
  <svg className="h-4 w-4 shrink-0 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

function useClickOutside(ref: React.RefObject<HTMLElement | null>, onOutside: () => void, active: boolean) {
  useEffect(() => {
    if (!active) return;
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onOutside();
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onOutside();
    }
    document.addEventListener("mousedown", handle);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", handle);
      document.removeEventListener("keydown", onKey);
    };
  }, [ref, onOutside, active]);
}

type Group = { label: string; options: string[] };

function Trigger({
  id,
  open,
  onClick,
  icon,
  children,
  hasValue,
}: {
  id: string;
  open: boolean;
  onClick: () => void;
  icon?: ReactNode;
  children: ReactNode;
  hasValue: boolean;
}) {
  return (
    <button
      id={id}
      type="button"
      aria-haspopup="listbox"
      aria-expanded={open}
      onClick={onClick}
      className={`flex w-full items-center gap-2 rounded-lg border bg-white px-4 py-3 text-left text-sm transition focus:outline-none focus:ring-2 focus:ring-swapspot-blue/20 ${
        open || hasValue ? "border-swapspot-blue" : "border-slate-200 hover:border-slate-300"
      }`}
    >
      {icon}
      <span className={`min-w-0 flex-1 truncate ${hasValue ? "font-medium text-slate-900" : "text-slate-600"}`}>
        {children}
      </span>
      {chevron}
    </button>
  );
}

/** Multi-select with search, grouped options (e.g. "Your skills" first) and checkboxes. */
export function MultiSelectFilter({
  label,
  placeholder,
  value,
  onChange,
  groups,
  emptyText = "No skills found",
}: {
  label: string;
  placeholder: string;
  value: string[];
  onChange: (next: string[]) => void;
  groups: Group[];
  emptyText?: string;
}) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, () => setOpen(false), open);

  const selected = new Set(value.map((v) => v.toLowerCase()));
  const filteredGroups = useMemo(() => {
    const q = query.trim().toLowerCase();
    const seen = new Set<string>();
    return groups
      .map((g) => ({
        label: g.label,
        options: g.options.filter((o) => {
          const k = o.toLowerCase();
          if (seen.has(k) || (q && !k.includes(q))) return false;
          seen.add(k);
          return true;
        }),
      }))
      .filter((g) => g.options.length);
  }, [groups, query]);

  function toggle(option: string) {
    const k = option.toLowerCase();
    onChange(selected.has(k) ? value.filter((v) => v.toLowerCase() !== k) : [...value, option]);
  }

  const summary =
    value.length === 0 ? placeholder : value.length === 1 ? value[0] : `${value[0]} +${value.length - 1}`;

  return (
    <div className="space-y-2" ref={ref}>
      <label htmlFor={id} className="block text-sm font-semibold text-slate-800">
        {label}
      </label>
      <div className="relative">
        <Trigger id={id} open={open} onClick={() => setOpen((o) => !o)} hasValue={value.length > 0}>
          {summary}
        </Trigger>

        {open ? (
          <div className="absolute z-30 mt-2 w-full min-w-[240px] rounded-xl border border-slate-100 bg-white p-2 shadow-lg">
            <input
              autoFocus
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search skills…"
              className="mb-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-swapspot-blue focus:outline-none focus:ring-2 focus:ring-swapspot-blue/20"
            />
            <div className="max-h-64 overflow-auto" role="listbox" aria-multiselectable="true">
              {filteredGroups.length === 0 ? (
                <p className="px-3 py-4 text-center text-sm text-slate-400">{emptyText}</p>
              ) : (
                filteredGroups.map((g) => (
                  <div key={g.label} className="mb-1">
                    <p className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                      {g.label}
                    </p>
                    {g.options.map((option) => {
                      const checked = selected.has(option.toLowerCase());
                      return (
                        <label
                          key={option}
                          role="option"
                          aria-selected={checked}
                          className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggle(option)}
                            className="h-4 w-4 rounded border-slate-300 accent-swapspot-blue"
                          />
                          <span className="truncate">{option}</span>
                        </label>
                      );
                    })}
                  </div>
                ))
              )}
            </div>
            {value.length ? (
              <div className="mt-2 flex justify-between border-t border-slate-100 px-1 pt-2">
                <button type="button" onClick={() => onChange([])} className="text-sm font-medium text-slate-500 hover:text-slate-800">
                  Clear
                </button>
                <button type="button" onClick={() => setOpen(false)} className="text-sm font-semibold text-swapspot-blue hover:underline">
                  Done
                </button>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}

/** Single-select dropdown styled to match the multi-select. */
export function SingleSelectFilter({
  label,
  placeholder,
  value,
  onChange,
  options,
  icon,
  clearable = true,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (next: string) => void;
  options: { value: string; label: string }[];
  icon?: ReactNode;
  clearable?: boolean;
}) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, () => setOpen(false), open);
  const current = options.find((o) => o.value === value);

  return (
    <div className="space-y-2" ref={ref}>
      <label htmlFor={id} className="block text-sm font-semibold text-slate-800">
        {label}
      </label>
      <div className="relative">
        <Trigger
          id={id}
          open={open}
          onClick={() => setOpen((o) => !o)}
          icon={icon}
          hasValue={Boolean(value) && (clearable || value !== options[0]?.value)}
        >
          {current?.label || placeholder}
        </Trigger>
        {open ? (
          <ul role="listbox" className="absolute z-30 mt-2 max-h-72 w-full overflow-auto rounded-xl border border-slate-100 bg-white p-2 shadow-lg">
            {clearable ? (
              <li>
                <button
                  type="button"
                  onClick={() => {
                    onChange("");
                    setOpen(false);
                  }}
                  className={`w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-slate-50 ${!value ? "font-semibold text-swapspot-blue" : "text-slate-600"}`}
                >
                  {placeholder}
                </button>
              </li>
            ) : null}
            {options.map((o) => (
              <li key={o.value}>
                <button
                  type="button"
                  role="option"
                  aria-selected={o.value === value}
                  onClick={() => {
                    onChange(o.value);
                    setOpen(false);
                  }}
                  className={`w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-slate-50 ${o.value === value ? "font-semibold text-swapspot-blue" : "text-slate-700"}`}
                >
                  {o.label}
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </div>
  );
}
